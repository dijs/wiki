import moment from 'moment';

const datePattern = /(\d+\|\d+\|\d+)/;

const determiners = {
  age: metadata => {
    if (!metadata.birth_date) {
      return;
    }
    const matches = metadata.birth_date.match(datePattern);
    if (!matches) {
      return;
    }
    const birthDate = moment(matches[1], 'YYYY|MM|DD');
    return moment().diff(birthDate, 'years');
  }
};

export default determiners;
