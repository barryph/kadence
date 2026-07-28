import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from './ExceptionFilter';
import ServerError from './shared/ServerError';

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();
  let json: jest.Mock;
  let status: jest.Mock;
  let response: { status: jest.Mock; json: jest.Mock };

  beforeEach(() => {
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
    response = { status, json };
  });

  function createHost(): ArgumentsHost {
    return {
      switchToHttp: () => ({
        getResponse: () => response,
      }),
    } as ArgumentsHost;
  }

  it('formats ServerError responses', () => {
    filter.catch(
      new ServerError('TEST_CODE', 'Test message', 422),
      createHost(),
    );

    expect(status).toHaveBeenCalledWith(422);
    expect(json).toHaveBeenCalledWith({
      error: { code: 'TEST_CODE', message: 'Test message' },
    });
  });

  it('formats HttpException responses', () => {
    filter.catch(
      new HttpException('Not found', HttpStatus.NOT_FOUND),
      createHost(),
    );

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      error: { statusCode: 404, message: 'Not found' },
    });
  });

  it('formats unknown errors as 500', () => {
    filter.catch(new Error('unexpected'), createHost());

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      error: { statusCode: 500, message: 'Internal server error' },
    });
  });
});
