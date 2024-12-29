import * as fs from 'fs';

interface ErrorMessage {
  errorCode: number;
  errorMessage: {
    statusCode: number;
    message: string;
  };
}

function errorProcessing(receivedErrorMessage: Error): ErrorMessage {
  console.log(receivedErrorMessage);
  // split the error response
  let errorMessage = receivedErrorMessage.message.split(':');
  errorMessage = errorMessage[1].split('|');
  let errorObject = errorMessage.length;

  // if no error code is provided. Call the _logger function to log error.
  if (errorObject <= 1) logErrorToFile(receivedErrorMessage);

  return {
    errorCode: errorObject > 1 ? parseInt(errorMessage[0].trim()) : 500,
    errorMessage: {
      statusCode: errorMessage ? Number(errorMessage[0].trim()) : 500,
      message: errorObject > 1 ? errorMessage[1] : 'Error Processing Request.',
    },
  };
}

function errorHandling(receivedErrorMessage: string): void {
  throw new Error(receivedErrorMessage);
}

function logErrorToFile(receivedErrorMessage: Error): void {
  console.log(receivedErrorMessage);
  fs.appendFileSync(
    'error.log.txt',
    new Date() + ' ' + receivedErrorMessage.message + '\r\n',
  );
}

export default {
  errorProcessing,
  errorHandling,
};

