# Guide lines

## Explaning the Check class

This is the default class you `MUST RETURN` when creting your tests. The class is very simple like below:

```ts
export class Check {
  url?: string
  error?: Error | string | string[] | undefined | null | unknown
  constructor(obj: Check) {
    this.url = obj.url
    this.error = obj.error
  }
}
```

Every test you create, you need to pass the `url` to help you identify the DNS of your test to display in the resuts and the `error` prop is used to check if your test passed.

Once the `error` is not empty, then this package will assume that your test fails and change the `status` to `false` in the `interface ReadinessIntegration` list and the main `status` of the `interface Readiness`

## Migrating from nodejs-health-checker

If you are migrating to this package or looking for cases of uses, below you'll find some examples of how to create tests to pass in the instance creation of Healthchecker

>Remenber, those examples below is just `examples`, please implement your own tests!

## Example to declare your own HTTP tests

```ts
// file src/integrations/http.ts
import { Check } from 'nodejs-health-checker-lw'
import { fetch } from 'node-fetch'
export async function HttpTest() Promise<Check> {
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

## Example to declare your memcache test

```ts
// file src/integrations/memcached.ts
import Memcached from "memcached" // or your own memcache driver
import { Check } from 'nodejs-health-checker-lw'
export async function MemcacheTest(): Promise<Check> {
  return new Promise((resolve, _) => {
    let result = new Check({ url: 'memcache.host:port' })
    const client = new Memcached(result.url, {
      timeout: config.timeout,
      retry: 1,
      retries: 1,
    });
    client.on("issue", (error) => {
      client.end();
      result.error = error
      resolve(result);
    });
    client.stats((error, status) => {
      client.end();
      result.error = error
      resolve(result);
    });
  });
}
```


## Example to declare your database test

```ts
// file src/integrations/database.ts
import { Sequelize } from "sequelize"; // or your own driver
import { Check } from 'nodejs-health-checker-lw'

export async function DatabaseTest(): Promise<Check> {
  return new Promise(async (resolve, _) => {
    let result = new Check({ url: 'database.host:port' })
    // init sequelize
    const sequelize = new Sequelize("root","root", "root", {
      dialect: "mysql",
      port: 3306,
      host: "mydatabase.host",
      logging: false,
    });
    // check authenticate to database
    try {
      await sequelize.authenticate();
      await sequelize.close();
    } catch (error) {
      result.error = error
    } finally {
      resolve(result)
    }
  });
}
```

## Example to create your own DynamoDB test

```ts
// file src/integrations/dynamo.ts
import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb"; // or another driver in your application
import { Check } from 'nodejs-health-checker-lw'
export async function DynamoTest(): Promise<Check> {
  return new Promise(async (resolve, _) => {
    let result = new Check({ url: 'dynamodb.host' })
    // init dynamo client
    const client = new DynamoDBClient({
      endpoint: "host.of.my.dynamo",
      region: "us-east-1",
      credentials: {
        accessKeyId: "YOUR-ACCESS-KEY",
        secretAccessKey: "YOUR-SECRET-ACCESS-KEY",
      },
      maxAttempts: 1,
    });
    // check if package table exists
    try {
      const response = await client.send(new ListTablesCommand({}));
      if (!response) {
        result.error = {message: "unable to list tables", response}
      }
    } catch (error) {
      result.error = error
    } finally {
      resolve(result)
    }
  });
}
```

## Example to create your own redis test

```ts
// file src/integrations/redis.ts
import { createClient } from "redis" // or your application driver
import { Check } from 'nodejs-health-checker-lw'

export async function RedisCheck(): Promise<Check> {
  return new Promise((resolve, _) => {
    let result = new Check({ url: 'your.redis.hosts:port' })
    const client = createClient({
      host: "redis.host",
      db: 0,
      password: "",
      connect_timeout: 3,
      port: 6379,
    })
    client.on("error", (error: any) => {
      client.end(true);
      result.error = error
      resolve(result)
    })
    client.ping((status) => {
      client.end(true);
      result.error = status !== null ? status : undefined
      resolve(result)
    })
  })
}
```

## Example using all integrations examples

```ts
import { HealthChecker} from 'nodejs-health-checker-lw'
import {HttpTest} from 'src/integrations/http'
import {MemcachedTest} from 'src/integrations/memcached'
import {DatabaseTest} from 'src/integrations/database'
import {DynamoTest} from 'src/integrations/dynamo'
import {RedisTest} from 'src/integrations/redis'

export const check = new HealthChecker({
  name: "my-app"
  version: "v1.0.0",
  integrations: [
    {
      name: 'github integration', 
      handle: HttpTest
    },
    {
      name: 'memcached integration', 
      handle: MemcachedTest
    },
    {
      name: 'database integration', 
      handle: DatabaseTest
    },
    {
      name: 'aws dynamodb integration', 
      handle: DynamoTest
    },
    {
      name: 'redis integration', 
      handle: RedisTest
    },
  ]
})
```

>Read more about `version` prop in [this examples](../README.md#version-in-your-healthchecker)

## [<-BACK TO README](../README.md#contributors)
