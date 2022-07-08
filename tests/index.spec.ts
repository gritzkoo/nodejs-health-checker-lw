import { HealthChecker } from "../src"
import { scenarios } from "./health-checker.mockery"

describe("health checker tester", () => {

  test("should execute liveness function", () => {
    const check = new HealthChecker({
      name: "test",
      version: "v1.0.0",
      integrations: []
    })
    const result = check.liveness()
    expect(result).toMatchObject({
      status: "fully functional",
      version: "v1.0.0"
    })
  })

  describe("should execute readiness with", () => {
    it.each([
      ['one integration and return true', scenarios.scene1],
      ['one integration and return an error with status false', scenarios.scene2],
      ['two integration and second integration return false', scenarios.scene3],
      ['two integration voiding throws from other context and return false', scenarios.scene4],
    ])("%s", async (_, scenario) => {
      const health = new HealthChecker({
        name: 'test',
        version: 'test',
        integrations: scenario.integrations
      })
      const result = await health.readiness()
      expect(result).toEqual(scenario.expected)
    })
  })

})
