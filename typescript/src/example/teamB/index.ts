import { BoundedContext } from '../../domainlang';
import { CredentialsContext } from '../teamA';

export const UsersContext: BoundedContext = new BoundedContext({ relationships: [CredentialsContext] });
