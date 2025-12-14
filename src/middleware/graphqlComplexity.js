const logger = require('../logger');

/**
 * GraphQL Query Complexity Plugin
 * Prevents expensive nested queries by limiting query depth and complexity
 */
const queryComplexityPlugin = {
  requestDidStart() {
    return {
      didResolveOperation({ request, document }) {
        const complexity = calculateComplexity(document, request.operationName);
        const maxComplexity = 1000; // Maximum allowed complexity
        const maxDepth = 10; // Maximum query depth

        const depth = calculateDepth(document);

        if (complexity > maxComplexity) {
          throw new Error(
            `Query is too complex. Complexity: ${complexity}, Maximum: ${maxComplexity}`
          );
        }

        if (depth > maxDepth) {
          throw new Error(
            `Query is too deep. Depth: ${depth}, Maximum: ${maxDepth}`
          );
        }

        logger.debug('GraphQL query complexity', {
          complexity,
          depth,
          operationName: request.operationName
        });
      }
    };
  }
};

/**
 * Calculate query complexity based on field selections
 */
function calculateComplexity(document, operationName) {
  let complexity = 0;
  const operation = document.definitions.find(
    def => def.kind === 'OperationDefinition' && 
    (operationName ? def.name?.value === operationName : true)
  );

  if (!operation) return 0;

  operation.selectionSet.selections.forEach(selection => {
    complexity += calculateFieldComplexity(selection, 1);
  });

  return complexity;
}

/**
 * Recursively calculate field complexity
 */
function calculateFieldComplexity(selection, depth) {
  let complexity = 1; // Base complexity for each field

  // Increase complexity for nested fields
  if (depth > 1) {
    complexity += depth * 2;
  }

  // Increase complexity for list fields (indicates potential N+1 queries)
  if (selection.selectionSet) {
    selection.selectionSet.selections.forEach(subSelection => {
      complexity += calculateFieldComplexity(subSelection, depth + 1);
    });
  }

  return complexity;
}

/**
 * Calculate maximum query depth
 */
function calculateDepth(document, operationName) {
  const operation = document.definitions.find(
    def => def.kind === 'OperationDefinition' && 
    (operationName ? def.name?.value === operationName : true)
  );

  if (!operation || !operation.selectionSet) return 0;

  let maxDepth = 0;

  operation.selectionSet.selections.forEach(selection => {
    const depth = calculateFieldDepth(selection, 1);
    maxDepth = Math.max(maxDepth, depth);
  });

  return maxDepth;
}

/**
 * Recursively calculate field depth
 */
function calculateFieldDepth(selection, currentDepth) {
  if (!selection.selectionSet) {
    return currentDepth;
  }

  let maxDepth = currentDepth;

  selection.selectionSet.selections.forEach(subSelection => {
    const depth = calculateFieldDepth(subSelection, currentDepth + 1);
    maxDepth = Math.max(maxDepth, depth);
  });

  return maxDepth;
}

module.exports = {
  queryComplexityPlugin
};
