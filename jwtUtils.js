import { decode } from 'base-64';

global.atob = decode;

const decodeToken = (token) => {
  try {
    return JSON.parse(global.atob(token.split('.')[1]));
  } catch (err) {
    console.log('Error decoding token:', err);
    return null;
  }
};

export { decodeToken };
