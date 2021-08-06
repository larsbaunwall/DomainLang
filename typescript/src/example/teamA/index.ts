import { BoundedContext } from '../../domainlang';
import { UsersContext } from '../teamB';

export const CredentialsContext: BoundedContext = new BoundedContext({ relationships: [UsersContext] });
