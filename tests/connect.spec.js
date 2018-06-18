const test = require('tape-async');
const sinon = require('sinon');
const url = require('url');
const fakeServer = {
  getEndPoint: sinon.stub(),
  getData: sinon.stub().returns('string')
};

const req = {
  url: '/api/v1/users'
};

const res = {
  setHeader: sinon.spy(),
  end: sinon.spy(),
};

const endpoint = {
  response: {},
  contentType: 'demo/text'
}

test('`connect middleware`', async (assert) => {

  const middleware = require('../lib/connect')(fakeServer);
  const next = sinon.spy();
  await middleware(req, res, next);

  assert.deepEqual(
    fakeServer.getEndPoint.getCall(0).args[0],
    { $req: req, $parsedUrl: url.parse(req.url, true), $routeMatch: null },
    'Calls Server#getEndPoint with formatted params'
  );

  assert.ok(
    next.called,
    'Calls the next middleware when no endpoint is returned'
  );

  fakeServer.getEndPoint.returns(endpoint)

  await middleware(req, res, next);

  assert.ok(
    fakeServer.getData.calledWithMatch(
      endpoint
    ),
    'Calls Server#getData with the resolved endpoint'
  );

  assert.ok(
    res.setHeader.calledWithExactly(
      'Content-Type',
      endpoint.contentType
    ),
    'Sets "Content-Type" header accondingly to the endpoint'
  );

  assert.ok(
    res.end.calledWithExactly('string'),
    'Outputs the value returned by Server#getData'
  );

  const clock = sinon.useFakeTimers();

  res.end.resetHistory();
  endpoint.delay = 1000;

  middleware(req, res, next).then(
    () => {
      assert.equal(
        res.end.callCount,
        1,
        'With a delay it doesn\'t output right away'
      );
      clock.restore();
      assert.end();
    }
  );

  assert.equal(
    res.end.callCount,
    0,
    'With a delay it doesn\'t output right away'
  );

  clock.tick(endpoint.delay);

});