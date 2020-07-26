const _ = require('lodash');
const jsonToFile = require('../utils/jsonToFile');

module.exports = class PostmanNutrienReporter {
  constructor(newman, options, collectionRunOptions) {
    this.newman = newman;
    this.options = options;
    this.collectionRunOptions = collectionRunOptions;
    this.ASSERTION_STATE = { false: 'passed', true: 'failed' },
    this.AGGREGATED_FIELDS = ['item', 'request', 'response', 'requestError'];

    this.netTestCounts = {};
    this.traversedRequests = {};
    this.aggregatedExecutions = {};
    this.aggregations = [];
    this.executions = _.get(this, 'summary.run.executions');
    this.assertions = {};
    this.items = {};
  }

  getFullName (item, separator) {
    if (_.isEmpty(item) || !_.isFunction(item.parent) || !_.isFunction(item.forEachParent)) { return; }
    const chain = [];
    item.forEachParent((parent) => { chain.unshift(parent.name || parent.id); });
    item.parent() && chain.push(item.name || item.id);
    return chain.join(_.isString(separator) ? separator : SEP);
  }

  transformAssertions(result, currentExecution) {
    let stream;
    let reducedExecution;
    let executionId = currentExecution.id;

    if (!_.has(traversedRequests, executionId)) {
        // Flag request instance as traversed
        _.set(traversedRequests, executionId, 1);

        // Setting base assertion and cumulative test details for the current request instance
        _.set(result, executionId, {});
        _.set(this.netTestCounts, executionId, { passed: 0, failed: 0 });

        reducedExecution = _.pick(currentExecution, this.AGGREGATED_FIELDS);

        if (reducedExecution.response && _.isFunction(reducedExecution.response.toJSON)) {
            reducedExecution.response = reducedExecution.response.toJSON();
            stream = reducedExecution.response.stream;
            reducedExecution.response.body = Buffer.from(stream).toString();
        }

        // Setting sample request and response details for the current request
        this.items[reducedExecution.item.id] = reducedExecution;
    }

    _.forEach(currentExecution.assertions, (assertion) => {
        let aggregationResult;
        let assertionName = assertion.assertion;
        let isError = _.get(assertion, 'error') !== undefined;
        let updateKey = _.get(this.ASSERTION_STATE, isError);

        result[executionId][assertionName] = result[executionId][assertionName] || {
            name: assertionName,
            passed: 0,
            failed: 0
        };

        aggregationResult = result[executionId][assertionName];

        ++aggregationResult[updateKey];
        ++this.netTestCounts[executionId][updateKey];
    });
  }

  aggregator(execution) {
    let parent = execution.item.parent();
    let previous = _.last(this.aggregations);
    let current = _.merge(items[execution.item.id], {
        assertions: _.values(assertions[execution.item.id]),
        cumulativeTests: this.netTestCounts[execution.item.id]
    });

    if (this.aggregatedExecutions[execution.id]) { return; }

    this.aggregatedExecutions[execution.id] = true;

    if (previous && parent.id === previous.parent.id) {
        previous.executions.push(current);
    } else {
        this.aggregations.push({
            parent: {
                id: parent.id,
                name: this.getFullName(parent) // TODO: build func to extract full name
            },
            executions: [current]
        });
    }
  }

  postmanReporter() {
    this.transformAssertions(this.executions);
    _.forEach(this.summary.run.executions, this.aggregator);
    const collectionReport = {
        name: 'nutrien-postman-reporter',
        default: 'newman-run-report.html',
        path: this.options.export,
        content: {
            timestamp: Date(),
            version: this.collectionRunOptions.newmanVersion,
            aggregations: this.aggregations,
            summary: {
                stats: this.summary.run.stats,
                collection: this.summary.collection,
                globals: _.isObject(this.summary.globals) ? this.summary.globals : undefined,
                environment: _.isObject(this.summary.environment) ? this.summary.environment : undefined,
                failures: this.summary.run.failures
            }
        }
    }

    this.exports.push(collectionReport);
    jsonToFile(results, 'Postman_Summary');
  }
}