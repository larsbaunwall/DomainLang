import { BoundedContext } from '../domainlang';
import { CredentialsContext } from './teamA';
import { UsersContext } from './teamB';

/* Examples */

const LoginContext = new BoundedContext({
  description: 'Credential management',
});

const ProfileContext = new BoundedContext({
  description: 'User profiles',
});

const x = UsersContext.relationships?.pop();

// const UserDomain = new Domain({
//   contains: [LoginContext, ProfileContext],
// });

// const map: ContextMap = {
//   contains: [UserDomain, LoginContext]
// }
