import request from "supertest";
import app from "../src/app";

beforeAll((done) => {
    jest.mock("redis", () => jest.requireActual("redis-mock"));
    done();
})

describe("GET /", () => {
    it("should return 200", (done) => {
        request(app).get("/").expect(200, done);
    });
});
