import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { getPrismicClient } from '../../services/prismic';
import Header from '../../components/Header';
import Comments from '../../components/Comments';

import styles from './post.module.scss';
import commonStyles from '../../styles/common.module.scss';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  uid: string;
  data: {
    title: string;
    subtitle: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface NeighborPost {
  uid: string;
  title: string;
}

interface PostProps {
  post: Post;
  beforePost: NeighborPost | null;
  nextPost: NeighborPost | null;
  previewRef: string;
}

export default function Post({
  post,
  beforePost,
  nextPost,
  previewRef,
}: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <h1 className={styles.loading}>Carregando...</h1>;
  }

  const numWordsPost = post.data.content.reduce((acc, section) => {
    const numWordsHeading = section.heading.split(' ').length;
    const numWordsBody = RichText.asText(section.body).split(' ').length;

    return acc + numWordsHeading + numWordsBody;
  }, 0);

  const postReadingTime = Math.ceil(numWordsPost / 200);

  return (
    <>
      <div className={styles.containerHeader}>
        <Header />
      </div>
      <div className={styles.banner}>
        <img src={post.data.banner.url} alt="banner" />
      </div>
      <main className={commonStyles.container}>
        <article className={styles.post}>
          <strong className={styles.title}>{post.data.title}</strong>
          <div className={commonStyles.postInformations}>
            <div className={commonStyles.informations}>
              <FiCalendar />
              <time>
                {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                  locale: ptBR,
                })}
              </time>
            </div>
            <div className={commonStyles.informations}>
              <FiUser />
              <aside>{post.data.author}</aside>
            </div>
            <div className={commonStyles.informations}>
              <FiClock />
              <aside>{postReadingTime} min</aside>
            </div>
          </div>
          <div className={styles.editingInformations}>

            <time>
              {format(new Date(post.last_publication_date), "'*editado em' dd MMM yyyy', às' HH:mm", {
                locale: ptBR,
              })}
            </time>
          </div>
          {post.data.content.map(section => {
            return (
              <div key={section.heading} className={styles.postContent}>
                <div className={styles.heading}>{section.heading}</div>
                <div
                  className={styles.content}
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(section.body),
                  }}
                />
              </div>
            );
          })}
        </article>

        <div className={styles.postNavigationButtons}>
          <div className={styles.beforePost}>
            {beforePost && (
              <Link href={beforePost.uid}>
                <a>
                  <strong>{beforePost.title}</strong>
                  <div>Post anterior</div>
                </a>
              </Link>
            )}
          </div>

          <div className={styles.nextPost}>
            {nextPost && (
              <Link href={nextPost.uid}>
                <a>
                  <strong>{nextPost.title}</strong>
                  <div>Próximo post</div>
                </a>
              </Link>
            )}
          </div>
        </div>
        <Comments />
      </main>
      {previewRef && (
        <aside className={commonStyles.preview}>
          <Link href="/api/exit-preview">
            <a>Sair do modo Preview</a>
          </Link>
        </aside>
      )}
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 2,
    }
  );

  const paths = posts.results.map(post => {
    return {
      params: { slug: post.uid },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  previewData,
}) => {
  const { slug } = params;
  const previewRef = previewData ? previewData.ref : null;
  const refOption = previewRef ? { ref: previewRef } : null;
  const prismic = getPrismicClient();

  const response = await prismic.getByUID('posts', String(slug), refOption);

  const before = (
    await prismic.query(Prismic.Predicates.at('document.type', 'posts'), {
      pageSize: 1,
      after: `${response.id}`,
      orderings: '[document.first_publication_date desc]',
    })
  ).results[0];

  const next = (
    await prismic.query(Prismic.Predicates.at('document.type', 'posts'), {
      pageSize: 1,
      after: `${response.id}`,
      orderings: '[document.first_publication_date]',
    })
  ).results[0];

  const post = {
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    uid: response.uid,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
    },
  };

  const beforePost = before
    ? {
      uid: before.uid,
      title: before.data.title,
    }
    : null;

  const nextPost = next
    ? {
      uid: next.uid,
      title: next.data.title,
    }
    : null;

  return {
    props: {
      post,
      beforePost,
      nextPost,
      previewRef,
    },
    revalidate: 60 * 30, // 30 min
  };
};
