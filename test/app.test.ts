import request from "supertest";
import app from "../src/app";

beforeAll((done) => {
    jest.mock("redis", () => jest.requireActual("redis-mock"));
    done();
})
