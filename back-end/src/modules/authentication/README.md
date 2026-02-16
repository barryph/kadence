Here we separate authentication into it's own module. This was the recommended approach by gipity and others online. Conceptually it makes sense, separating the authentications application and infrastructural concerns separate from the users, but may not be the most practical.
Stemmler in his ddd-form repo instead includes authentication in his users module (DDD module).
Stemmlers repo: https://github.com/stemmlerjs/ddd-forum/tree/master/src/modules/users/services
