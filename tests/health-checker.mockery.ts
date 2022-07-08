import { Check, Integration } from "../src"

const defaultExpectancy = {
  name: expect.any(String),
  version: expect.any(String),
  date: expect.any(Date),
  duration: expect.any(Number),
  integrations: expect.anything()
}
const integrationExpectancy = {
  name: expect.any(String),
  status: expect.any(Boolean),
  response_time: expect.any(Number)
}

interface Setup {
  expected: any
  integrations: Integration[]
}

export interface Scenarios {
  [key: string]: Setup
}

export const scenarios: Scenarios = {
  scene1: {
    expected: {
      ...defaultExpectancy,
      status: true,
      integrations: expect.arrayContaining([
        expect.objectContaining({
          ...integrationExpectancy,
          status: true
        })
      ])
    },
    integrations: [
      {
        name: 'test',
        handle: async (): Promise<Check> => {
          return { url: 'test' }
        }
      },
    ]
  },
  scene2: {
    expected: {
      ...defaultExpectancy,
      status: false,
      integrations: expect.arrayContaining([
        expect.objectContaining({
          ...integrationExpectancy,
          status: false
        })
      ])
    },
    integrations: [
      {
        name: 'test',
        handle: async (): Promise<Check> => {
          return { url: 'test', error: new Error("testing") }
        }
      },
    ]
  },
  scene3: {
    expected: {
      ...defaultExpectancy,
      status: false,
      integrations: expect.arrayContaining([
        expect.objectContaining({
          ...integrationExpectancy,
          status: true
        }),
        expect.objectContaining({
          ...integrationExpectancy,
          status: false,
          error: expect.any(Error)
        }),
      ])
    },
    integrations: [
      {
        name: 'test',
        handle: async (): Promise<Check> => {
          return { url: 'test' }
        }
      },
      {
        name: 'test',
        handle: async (): Promise<Check> => {
          return { url: 'test', error: new Error("testing") }
        }
      },
    ]
  },
  scene4: {
    expected: {
      ...defaultExpectancy,
      status: false,
      integrations: expect.arrayContaining([
        expect.objectContaining({
          ...integrationExpectancy,
          status: true,
          url: 'test'
        }),
        expect.objectContaining({
          ...integrationExpectancy,
          status: false,
          error: expect.any(Error)
        }),
      ])
    },
    integrations: [
      {
        name: 'test',
        handle: async (): Promise<Check> => {
          return { url: 'test' }
        }
      },
      {
        name: 'test',
        handle: async (): Promise<Check> => {
          throw new Error("testing");
        }
      },
    ]
  },
}
