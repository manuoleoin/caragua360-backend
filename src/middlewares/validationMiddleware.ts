function getQuery(req: any) {
  return req.validatedQuery ?? req.query;
}
function getParams(req: any) {
  return req.validatedParams ?? req.params;
}
export { getQuery, getParams };
