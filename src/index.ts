export interface HealthConfig {
  name: string
  version: string
  integrations: Integration[]
}
export interface Integration {
  name: string
  handle(): Promise<Check>
}
export class Check {
  url?: string
  error?: Error | string | string[] | undefined | null | unknown
  constructor(obj: Check) {
    this.url = obj.url
    this.error = obj.error
  }
}
export interface Liveness {
  status: string
  version: string
}
export interface Readiness {
  name: string
  version: string
  status: boolean
  date: Date
  duration: number
  integrations: ReadinessIntegration[]
}
export interface ReadinessIntegration {
  name: string
  status: boolean
  response_time: number
  url?: string
  error?: Error | string | string[] | undefined | null | unknown
}
export class HealthChecker implements HealthConfig {
  name: string
  version: string
  integrations: Integration[]
  constructor(config: HealthConfig) {
    this.name = config.name
    this.version = config.version
    this.integrations = config.integrations
  }
  liveness(): Liveness {
    return {
      status: "fully functional",
      version: this.version
    }
  }
  async readiness(): Promise<Readiness> {
    const start = new Date().getTime()
    const promises: Promise<ReadinessIntegration>[] = [];
    this.integrations.forEach(v => promises.push(this.check(v)))
    const result = await Promise.all(promises)
    return {
      name: this.name,
      version: this.version,
      status: !result.some(({ status }) => status === false),
      date: new Date(),
      duration: this.delta(start),
      integrations: result.map(v => v)
    }
  }
  private async check(integration: Integration): Promise<ReadinessIntegration> {
    const start = new Date().getTime()
    let result = new Check({url:'unknow'})
    try {
      result = await integration.handle()
    } catch (error: unknown) {
      result.error = error
    }
    return {
      name: integration.name,
      status: !result.error,
      response_time: this.delta(start),
      url: result.url,
      error: result.error
    }
  }
  private delta(time: number): number {
    return (new Date().getTime() - time) / 1000
  }
}
