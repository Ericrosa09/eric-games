// appwrite-config.js
const { client } = appwrite;

const client = new client();
client
  .setendpoint('https://cloud.appwrite.io/v1')
  .setproject('64b1f8fe77b86539c325');

export default client;
