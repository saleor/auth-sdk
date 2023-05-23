import createFetchMock from "vitest-fetch-mock";
import { beforeEach, vi } from "vitest";

const fetchMocker = createFetchMock(vi);
fetchMocker.enableMocks();

beforeEach(() => {
  fetchMocker.resetMocks();
  fetchMocker.doMock();
});
