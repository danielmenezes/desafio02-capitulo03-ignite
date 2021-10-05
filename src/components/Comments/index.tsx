import { useUtterances } from '../../services/utteranc';

export default function Comments(): JSX.Element {
  useUtterances('comments');
  return <div id="comments" />;
}
