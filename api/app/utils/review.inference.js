const config = require("./config");
const db = require("../sequelize/models");
const Op = db.Sequelize.Op;

const unixEpochTimeInMilliseconds = getUnixTimeFromHours(config.expiryTimeInHours)

const buildIsActiveCondition = (currentTime) => {
  const timeStringAt24HoursPrior = new Date(currentTime - unixEpochTimeInMilliseconds).toISOString();
  return { 
    createdAt: { [Op.gte]: timeStringAt24HoursPrior },
    mergedAt: { [Op.eq]: null }, // no mergedAt
    archivedAt: { [Op.eq]: null } // no archivedAt
  };
}
const buildIsPendingCondition = (currentTime) => {
  const timeStringAt24HoursPrior = new Date(currentTime - unixEpochTimeInMilliseconds).toISOString();
  return { 
    createdAt: { [Op.lt]: timeStringAt24HoursPrior }, // expired
    submittedAt: { [Op.not]: null }, // has been submitted
    mergedAt: { [Op.eq]: null }, // no mergedAt
    archivedAt: { [Op.eq]: null } // no archivedAt
  };
}

const buildIsInActiveCondition = (currentTime) => {
  const timeStringAt24HoursPrior = new Date(currentTime - unixEpochTimeInMilliseconds).toISOString();
  return { 
    [Op.or]: {
      mergedAt: { [Op.not]: null }, // has been merged
      archivedAt: { [Op.not]: null }, // has been archived
      // inactive conditions when review has expired
      [Op.and]: {
        createdAt: { [Op.lt]: timeStringAt24HoursPrior }, // expired
        submittedAt: { [Op.eq]: null }, // has not been submitted
      }
    }
  };
}

function getUnixTimeFromHours(hours) {
  const millisecondsInHour = 60 * 60 * 1000;
  const unixTimeInMilliseconds = hours * millisecondsInHour;
  return unixTimeInMilliseconds;
}

module.exports = {
  getUnixTimeFromHours,
  buildIsActiveCondition,
  buildIsPendingCondition,
  buildIsInActiveCondition,
}
