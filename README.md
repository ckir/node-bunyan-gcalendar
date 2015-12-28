# node-bunyan-gcalendar

A promise based implementation (bluebird) of node-bunyan to write log records to Google Calendar

## Documentation

### Installation
```bash
npm install node-bunyan-gcalendar --save
```

### How does it work?

When using Google APIs from the server (or any non-browser based application), authentication is performed through a Service Account, which is a special account representing your application. This account has a unique email address that can be used to grant permissions to.

Now that the Service Account has permission to some user resources, the application can query the API with OAuth2.

When using OAuth2, authentication is performed using a token that has been obtained first by submitting a JSON Web Token (JWT). The JWT identifies the user as well as the scope of the data he wants access to. The JWT is also signed with a cryptographic key to prevent tampering. Google generates the key and keeps only the public key for validation.
You must keep the private key secure with your application so that you can sign the JWT in order to guarantee its authenticity.

The application requests a token that can be used for authentication in exchange with a valid JWT. The resulting token can then be used for multiple API calls, until it expires and a new token must be obtained by submitting another JWT.

### Creating a Service Account using the Google Developers Console

1. From the [Google Developers Console](https://cloud.google.com/console), select your project or create a new one.

2. Under "APIs & auth", click "Credentials".

3. Under "OAuth", click the "Create new client ID" button.

4. Select "Service account" as the application type and click "Create Client ID".

5. The key for your new service account should prompt for download automatically.

That's it! You now have a service account with an email address and a key that you can use from your Node application.

### Granting access to resources to be requested through an API

In order to query resources using the API, access must be granted to the Service Account. Each Google application that has security settings must be configured individually. Access is granted by assigning permissions to the service account, using its email address found in the API console.

To access a calendar, the calendar must be shared with the service account.

### Create NBGC.aes

Use the encrypt_nbgc.js utility to create an encrypted file. Then store the generated NBGC.aes at location accesible by a url (s3 or so)

### Environment variables

You need to set two environment variables

NBGC_AES = The url where the NBGC.aes is stored

NBGC_KEY = The password you used for the encryption

### How to use it

Have a look at the example.js to get an idea on how to use it.
