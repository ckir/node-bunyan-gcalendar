# node-bunyan-gcalendar

A promise based implementation (bluebird) of node-bunyan to write log records to Google Calendar

First you need to create a google application.

Then download a .json certification from google console.

Then create a Google Calendar and authorize your application to write to it.

Then you need to set the following environment variables (use the generateNBGC_CERTIFICATE.js to easily convert your certificate to an environment variable)

Environment variables

NBGC_EMAIL

NBGC_CERTIFICATE

NBGC_CALENDAR

NBGC_LEVEL

Have a look at the example.js to get an idea on how to use it.
