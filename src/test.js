import wiki from './wiki';

wiki({
  apiUrl: 'https://ru.wikipedia.org/w/api.php'
})
  .page('Boletus edulis')
  // .page('Main Page')
  .then(page => {
    console.log(page);
    page.summary().then(summary => console.log(summary));
  })
  .catch(e => console.error(e));
