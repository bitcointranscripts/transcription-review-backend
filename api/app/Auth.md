# Auth flow

## Sign up

1. User signs in to the app on the frontend using github and gets a Oauth token from github
2. Send the {Oauth token, username, email} to the backend
3. On the backend, we create a new jwt and encrypt the Oauth token in it and send it back to the frontend

## Sign in

1. User login with github, we send just the Oauth token to the backend
2. The backend calls [github api](https://docs.github.com/en/rest/users/users?apiVersion=2022-11-28#get-the-authenticated-user) to verify the user
3. If the user login details matches the stored data in the db, we send a new jwt (with new token encrypted) to the frontend
4. Edge case: For existing users without a jwt, we collect the token from the frontend(gotten from github) and check if the user exists in the db. If true, we create a new jwt (with the token encrpted in it) and send it to the frontend for auth.

## Middleware (auth routes)

1. Auth routes include all routes except get-transcript
2. User has to be authenticated to access any auth route
3. User with Admin roles have special privilegdes
4. User can:
    i. cliam transcript & create a review
    ii. update transcript (content)
    iii. submit a review
    iv. fetch and create transactions
    v. get review by id
5. Admin can:
    i. perform all user operations
    ii. archive transcript
    iii. update user role
