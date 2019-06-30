class AppConfigs {

  // constructor
  constructor(metalRateRecords, purchaseRateDiffRecords, gradesMakingRateDiffRecords, itemsConfigRecords) {
    this.metalRate = metalRateRecords.reduce((accumulator, record) => {
      accumulator[record.METAL] = Number(record.RATE);
      return accumulator;
    }, {});

    this.purchaseRateDiff = purchaseRateDiffRecords.reduce((accumulator, record) => {
      accumulator[record.METAL] = Number(record.DIFF);
      return accumulator;
    }, {});

    this.grades = [...new Set(gradesMakingRateDiffRecords.map(record => record.GRADE))];

    this.gradeMakingRateDiff = gradesMakingRateDiffRecords.reduce((accumulator, record) => {
      accumulator[record.GRADE] =
        accumulator[record.GRADE] == null ? {} : accumulator[record.GRADE];
      accumulator[record.GRADE][record.METAL] = Number(record.DIFF);
      return accumulator;
    }, {});

    this.itemTypes = itemsConfigRecords.reduce((accumulator, record) => {
      accumulator[record.METAL] =
        accumulator[record.METAL] == null ? new Map() : accumulator[record.METAL];
      if (accumulator[record.METAL].get(record.TYPE) == null) {
        accumulator[record.METAL].set(record.TYPE, []);
      }

      accumulator[record.METAL].get(record.TYPE).push(record.ITEM);
      return accumulator;
    }, {});

    this.itemConfigs = itemsConfigRecords.reduce((accumulator, record) => {
      Object.keys(record).forEach(key => {
        if (!isNaN(Number(record[key]))) {
          record[key] = Number(record[key]);
        }
      });
      accumulator.set([record.METAL, record.ITEM].toString(), record);
      return accumulator;
    }, new Map());
  }
};

module.exports = AppConfigs;
