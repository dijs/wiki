const datePattern = /(\d+)\|(\d+)\|(\d+)/;
const millisInYear = 1000 * 60 * 60 * 24 * 365;

const determiners = {
  age: metadata => {
    if (!metadata.birth_date) {
      return;
    }
    const matches = metadata.birth_date.match(datePattern);
    if (!matches) {
      return;
    }
    const [, year, month, date] = matches;
    const birthDate = new Date(year, month, date);
    return Math.floor((Date.now() - birthDate) / millisInYear);
  }
};

export default determiners;
