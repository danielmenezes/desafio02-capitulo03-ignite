import Link from 'next/link';
import styles from './header.module.scss';

interface HomeProps {
  className: string;
}

export default function Header(): JSX.Element {
  return (
    <header className={styles.headerContainer}>
      <Link href="/">
        <a>
          <img src="/images/logo.svg" alt="logo" />
        </a>
      </Link>
    </header>
  );
}
