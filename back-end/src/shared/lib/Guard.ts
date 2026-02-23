interface IGuardArgument {
  argument: any;
  argumentName: string;
  message?: string;
}

interface IGuardAgainstNullOrUndefinedResult {
  succeeded: boolean;
  message?: string;
}

/**
 * Helper methods to validate data
 * Often used in the create methods of Entities to ensure validity of data before
 * creating an instance
 *
 * From: https://github.com/stemmlerjs/white-label/blob/503ee491192a3eff026704f4de9a7477daebb630/src/core/logic/Guard.ts
 */
export class Guard {
  // combine(guardResults) {
  //   for (const result of guardResults) {
  //     if (result.succeeded === false) return result;
  //   }
  //
  //   return { succeeded: true };
  // }

  static againstNullOrUndefined(
    argument: any,
    argumentName: string,
    message?: string,
  ): IGuardAgainstNullOrUndefinedResult {
    if (argument === null || argument === undefined) {
      return {
        succeeded: false,
        message: message || `${argumentName} is null or undefined`,
      };
    }
    return { succeeded: true };
  }

  static againstNullOrUndefinedBulk(
    args: IGuardArgument[],
  ): IGuardAgainstNullOrUndefinedResult {
    for (const arg of args) {
      const result = this.againstNullOrUndefined(
        arg.argument,
        arg.argumentName,
      );
      if (!result.succeeded) return result;
    }

    return { succeeded: true };
  }

  // static isOneOf(value, validValues, argumentName) {
  //   let isValid = false;
  //
  //   for (const validValue of validValues) {
  //     if (value === validValue) {
  //       isValid = true;
  //     }
  //   }
  //
  //   if (isValid) {
  //     return { succeeded: true };
  //   }
  //   return {
  //     succeeded: false,
  //     message: `${argumentName} isn't oneOf the correct types in ${JSON.stringify(
  //       validValues,
  //     )}. Got "${value}".`,
  //   };
  // }
  //
  // static inRange(num, min, max, argumentName) {
  //   const isInRange = num >= min && num <= max;
  //   if (!isInRange) {
  //     return {
  //       succeeded: false,
  //       message: `${argumentName} is not within range ${min} to ${max}.`,
  //     };
  //   }
  //   return { succeeded: true };
  // }
  //
  // static allInRange(numbers, min, max, argumentName) {
  //   let failingResult = null;
  //
  //   for (const num of numbers) {
  //     const numIsInRangeResult = this.inRange(num, min, max, argumentName);
  //     if (!numIsInRangeResult.succeeded) failingResult = numIsInRangeResult;
  //   }
  //
  //   if (failingResult) {
  //     return {
  //       succeeded: false,
  //       message: `${argumentName} is not within the range.`,
  //     };
  //   }
  //   return { succeeded: true };
  // }
}
