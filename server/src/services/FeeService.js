const BaseService = require('./BaseService');

class FeeService extends BaseService {
  constructor() {
    super('fee_ledger');
  }
  
  // Custom methods like getDailyCollection can go here
}

module.exports = new FeeService();
