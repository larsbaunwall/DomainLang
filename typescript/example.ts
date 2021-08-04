import { Domain, BoundedContext, me } from "./domainlang";

/* Examples */

const LoginContext: BoundedContext = {
  description: "Credential management",
};

const ProfileContext: BoundedContext = {
  description: "User profiles",
  relationships: [
    {
      upstream: LoginContext,
      downstream: me,
    },
  ],
};

const UserDomain: Domain = {
  contains: [LoginContext, ProfileContext],
};
