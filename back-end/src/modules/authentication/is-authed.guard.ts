import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * Requires the user is authenticated to access a route
 *
 * Example usage on a controller:
 * @UseGuards(IsAuthedGuard)
 * @Get('/protec')
 * protec() {
 *   console.log('my secret route');
 *   return { myData: 'this is a secret' };
 * }
 */
@Injectable()
export class IsAuthedGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    console.log('is AUTH GUARRDRD!!!!!!!!!!!!!!!!!!!!$@#$');
    const request = context.switchToHttp().getRequest();
    if (request.isAuthenticated && request.isAuthenticated()) {
      return true;
    }
    throw new UnauthorizedException('Not authenticated');
  }
}
