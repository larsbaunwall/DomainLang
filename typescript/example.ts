import { BoundedContext, me, ContextMap, Domain } from "./domainlang";

/* Examples */

const LoginContext: BoundedContext = {
  description: "Credential management",
  type:"",
  name:""
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

const UserDomain = new Domain({
  contains: [LoginContext, ProfileContext],
});

const map: ContextMap = {
  contains: [UserDomain, LoginContext]
}

const a = map.contains[0];
a.constructor.name