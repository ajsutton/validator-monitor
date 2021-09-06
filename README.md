# Validator Monitor

A side-car process that uses the standard beacon REST API to monitor for unhelpful, but not slashable validator behaviour.

## Running

Requires a sync'd beacon node the supports the standard REST API. Then run:

```
npm run start -- <beacon-node-url>
```

For example with a local teku:

```
npm run start -- http://localhost:5051
```