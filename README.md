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

## contributors

![contributors](https://contrib.rocks/image?repo=gritzkoo/nodejs-health-checker-lw)
>Made with [contributors-img](https://contrib.rocks).
____

A successor package for [`nodejs-health-checker`](https://github.com/gritzkoo/nodejs-health-checker) to simplify health checks.

The main purpose of this package is to substitute [`nodejs-health-checker`](https://github.com/gritzkoo/nodejs-health-checker) package and standardize the liveness and readiness actions for Nodejs applications running in Kubernetes deployments, without adding complexity and extra package installs.

Read more about migrating from [`nodejs-health-checker`](https://github.com/gritzkoo/nodejs-health-checker) or creating your tests in [MIGRATIONS GUIDELINES](docs/MIGRATIONS.md)

___

## Liveness method

Will return a `JSON` as below:

```json
{
  "status": "fully functional",
  "version": "v1.0.0"
}
```

## Readiness method

Will return a `JSON` as below:
>The `status` prop will return true once all your integrations works. If one of then fails, this `status` prop will reflect that something went wrong and you need to check the `status` inside `integrations` prop

```json
{
  "name": "myapp",
  "version": "v1.0.0",
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

## How to install

```sh
npm i --save nodejs-health-checker-lw
```

OR

```sh
yarn add nodejs-health-checker-lw
```

## How to init

First, you `need` to write your test like below:
>this example is using http check for API integrations. Remember that you can write using your own methods and patterns. You need only to return an instance of `nodejs-health-checker Check`.

```ts
// file src/integrations/github.ts
import { Check } from 'nodejs-health-checker-lw'
import { fetch } from 'node-fetch'
export async function TestGithubIntegration() Promise<Check> {
  return new Promise((resolve, _) => {
    let result = new Check({ url: 'https://github.com/status' })
    // call a url to test connectivity and HTTP status
    fetch(result.url, { timeout: 10000 })
      .then(response => {
        if (response.status !== 200) {
          result.error = {
            status: response.status,
            body: response.body
          }
        }
      })
      .catch(error => result.error = error)
      .finally(() => resolve(result))
  })
}

```

Then in your main declarations, you `MUST` create a `const` with `HealthChecker` from `nodejs-health-checker-lw` and fill a few props to create a re-usable pointer to be called after as below.
> Read more about the `version` [in this topic](README.md#version-in-your-healthchecker)

```ts
// file src/healthchecker.ts
import { HealthChecker} from 'nodejs-health-checker-lw'
import { TestGithubIntegration } from 'src/integrations/github' // as the example above. This list can grow as mush as you need
export const check = new HealthChecker({
  name: 'myapp', // set your application name
  version: 'v1.0.0', // set the version of your application
  // integrations are the list of tests that needs to be executed.
  integrations: [
    {
      // set the name of the integration that will be tested
      name: 'github integration', 
      // pass the functions that tests this integration
      handle: MyIntegrationTest
    }
  ]
})
```

## How to use it

Once you create a constant with an instance of HealthChecker, you can now call the methods, liveness, and readiness, in your application, in CLI or API mode

### CLI interface

```js
import check from 'src/healthchecker' // as the example above
const cliArgs = process.argv.slice(2)
switch (cliArgs[0]) {
  case 'liveness':
    console.log(check.liveness())
    break
  case 'readiness':
    check.readiness().then(response => {
      if (!response.status) {
        // do something like trigger an alarm or log to other obervability stacks
        console.warning(JSON.stringify({message: "health check fails", results: response}))
      } else {
        // or just log OK to track
        console.info(JSON.stringify(response));
      }
    })
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
            args:
              - "liveness"
        readinessProbe:
          exec:
            command:
              - "/bin/node"
              - "your-script.js"
            args:
              - "readiness"
```

___

## HTTP interface

In `Javascript`

```ts
import express from 'express'
import check from 'src/healthchecker' // as the example above
const PORT = process.env.PORT||80;
const server = express()
server.get('/health-check/liveness', (_, res) => {
  res.json(check.liveness())
})
server.get('/health-check/readiness', async (_, res) => {
  const result = await check.readiness()
  if (!response.status) {
    // do something like trigger an alarm or log to other obervability stacks
    console.warning(JSON.stringify({message: "health check fails", results: response}))
  } else {
    // or just log OK to track
    console.info(JSON.stringify(response));
  }
  res.json(result)
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

It's important to share that you `MUST` return always an `OK` status in Kubernetes liveness and readiness because if one of your integration fails, this can teardown all of your pods and make your application unavailable. Use other observability stacks like `Zabbix` or `Grafana alarms` to track your application logs and then take actions based on observability! `(I learned it by the hard way =/ )`

___

## More pieces of information

___

### Version in your `HealthChecker`

I highly recommend you fill this prop using a dynamic file content loading like:

- reading the `package.json` file and using the `version` value to fill the `HealthChecker.version` placeholder like below:

  ```ts
  import fs from 'fs'
  import path from 'path'
  import { HealthChecker } from 'nodejs-health-checker-lw'
  import { TestGithubIntegration } from 'src/integrations/github' 
  
  const versionFilePath = path('package.json')
  const file = {
    content: null
    error: undefined
  }
  try {
    let tmpRawData = await fs.readFileSync(versionFilePath, {encoding: 'utf8'})
    file.content = JSON.parse(tmpRawData)
  } catch (error) {
    file.error = error
  }

  export const check = new HealthChecker({
    name: 'myapp',
    version: file.error || file.content.version
    integrations: [/*and the list of your integrations here*/]
  })

  ```

- creating a file like `version.txt` using a command like the below in the pipeline before a `docker build/push` steps:

  ```sh
  git show -s --format="%ai %H %s %aN" HEAD > version.txt
  ```
  
  then use it in your code like:

  ```ts
  import fs from 'fs'
  import path from 'path'
  import { HealthChecker } from 'nodejs-health-checker-lw'
  import { TestGithubIntegration } from 'src/integrations/github' 

  const versionFilePath = path('version.txt')
  const file = {
    content: null
    error: undefined
  }
  try {
    file.content = await fs.readFileSync(versionFilePath, {encoding: 'utf8'})
  } catch (error) {
    file.error = error
  }
  export const check = new HealthChecker({
    name: 'myapp',
    version: file.error || file.content
    integrations: [/*and the list of your integrations here*/]
  })
  ```
