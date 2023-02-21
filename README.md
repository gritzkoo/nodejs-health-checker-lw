# nodejs-health-checker-lw

<div align="center">

![npm](https://img.shields.io/npm/dt/nodejs-health-checker-lw?style=for-the-badge)

[![test](https://github.com/gritzkoo/nodejs-health-checker-lw/actions/workflows/main.yml/badge.svg?branch=main)](https://github.com/gritzkoo/nodejs-health-checker-lw/actions/workflows/main.yml)
[![build](https://github.com/gritzkoo/nodejs-health-checker-lw/actions/workflows/build.yaml/badge.svg?branch=main)](https://github.com/gritzkoo/nodejs-health-checker-lw/actions/workflows/build.yaml)
[![Coverage Status](https://coveralls.io/repos/github/gritzkoo/nodejs-health-checker-lw/badge.svg?branch=main)](https://coveralls.io/github/gritzkoo/nodejs-health-checker-lw?branch=main)
![GitHub](https://img.shields.io/github/license/gritzkoo/nodejs-health-checker-lw)
![GitHub issues](https://img.shields.io/github/issues/gritzkoo/nodejs-health-checker-lw)
![npm](https://img.shields.io/npm/v/nodejs-health-checker-lw)
[![Tag Status](https://img.shields.io/github/v/tag/gritzkoo/nodejs-health-checker-lw)](https://img.shields.io/github/v/tag/gritzkoo/nodejs-health-checker-lw)
[![Languages Status](https://img.shields.io/github/languages/count/gritzkoo/nodejs-health-checker-lw)](https://img.shields.io/github/languages/count/gritzkoo/nodejs-health-checker-lw)
[![Repo Size Status](https://img.shields.io/github/repo-size/gritzkoo/nodejs-health-checker-lw)](https://img.shields.io/github/repo-size/gritzkoo/nodejs-health-checker-lw)
</div>
____

A successor package for [nodejs-health-checker](https://github.com/gritzkoo/nodejs-health-checker) to simplify health checks.

The main purpose of this package is to standardize the liveness and readiness actions for Nodejs applications, for Kubernetes deployments.

## How to install

```sh
npm i --save nodejs-health-checker-lw
```

OR

```sh
yarn add nodejs-health-checker-lw
```

## Creating your own checkers

It's important to keep in mind that you need to create the tests you API needs as the example below:

```ts
// file /app/src/github.ts
import { Check } from 'nodejs-health-checker-lw'
import 'fetch' from 'node-fetch'

export const MyIntegrationTest = async(): Promise<Check> => {
  const check = new Check({url: 'https://github.com/status'})
  fetch(check.url,{
    timeout: 10
  }).then( response => {
    check.status = response.status === 200;
    check.error = response.status !== 200 ? { http_status: response.status } : undefined,
    resolve(check)
  }).catch( error => {
    check.error = error
    resolve(check)
  })
}
```

## How to init

```ts
import { HealthChecker, Check } from 'nodejs-health-checker-lw'
import { MyIntegrationTest } from 'src/github'
export const check = new HealthChecker({
  name: 'myapp',
  version: 'v1.0.0',
  // integrations are the list of outside integrations of your API you need to test
  // to guarantee that your service is healthy to work
  integrations: [
    {
      // name is just a string that will help you fast identify the integration you need to check-on
      name: 'github integration',
      //
      handle: MyIntegrationTest
      }
    }
  ]
})
```

___

## Liveness method

Will return an `JSON` as below:

```json
{
  "status": "fully functional",
  "version": "v1.0.0"
}
```

## Readiness method

Will return an `JSON` as below:

```jsonc
{
  "name": "myapp",
  "version": "v1.0.0",
  // the main status of all integrations
  // will return true when none of integrations fails
  "status": true,
  "date": "2022-07-10T00:46:19.186Z",
  "duration": 0.068,
  "integrations": [
    {
      "name": "github integration",
      "status": true,
      "response_time": 0.068,
      "url": "https://github.com/status"
    }
  ]
}
```

___

## How to use it

Once you create a constant with an instance of HealthChecker, you can now call the methods, liveness, and readiness, in your application, in CLI or API mode

### CLI interface

```js
import check from 'src/to/your/check/const'
const cliArgs = process.argv.slice(2)
switch (cliArgs[0]) {
  case 'liveness':
    console.log(check.liveness())
    break
  case 'readiness':
    check.readiness().then(response => console.log(response))
    break
  default:
    console.error(`invalid option: ${cliArgs[0]}... accepty only liveness or readiness`)
}
```

In `Kubernetes` deployment

``` yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: your-nodejs-app
spec:
  selector:
    matchLabels:
      app: your-nodejs-app
  template:
    metadata:
      labels:
        app: your-nodejs-app
    spec:
      containers:
      - name: your-nodejs-app
        image: your-nodejs-app:tag
        resources:
          limits:
            memory: "128Mi"
            cpu: "500m"
        ports:
        - containerPort: 80
        livenessProbe:
          exec:
            command:
              - "/bin/node"
              - "your-script.js"
              - "liveness"
        readinessProbe:
          exec:
            command:
              - "/bin/node"
              - "your-script.js"
              - "readiness"
```

____

## HTTP interface

In `javascript`

```js
import express from 'express'
import check from 'src/to/your/check/const'
const PORT = process.env.PORT||80;
const server = express()
server.get('/health-check/liveness', (_, res) => {
  res.json(check.liveness())
})
server.get('/health-check/readiness', async (_, res) => {
  res.json(await check.readiness())
})
server.listen(PORT, () => {
  console.log(`[SERVER] Running at http://localhost:${PORT}`);
});
```

In `Kubernetes deployment`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: your-nodejs-app
spec:
  selector:
    matchLabels:
      app: your-nodejs-app
  template:
    metadata:
      labels:
        app: your-nodejs-app
    spec:
      containers:
      - name: your-nodejs-app
        image: your-nodejs-app:tag
        resources:
          limits:
            memory: "128Mi"
            cpu: "500m"
        ports:
        - containerPort: 80
        livenessProbe:
          httpGet:
            path: /health-check/liveness
            port: http
        readinessProbe:
          httpGet:
            path: /health-check/readiness
            port: http
```

____
