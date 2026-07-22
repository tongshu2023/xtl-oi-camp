(function () {
  window.CSPJ_DATA = window.CSPJ_DATA || {};
  const years = [2019, 2020, 2021, 2022, 2023, 2024];
  window.CSPJ_DATA.realExams = years.map((year, index) => ({
    id: `SAMPLE-CSPJ-${year}`, year, title: `${year} CSP-J 第一轮真题卷`, duration: 30,
    source: `SAMPLE · ${year} CSP-J 第一轮结构样卷`, sample: true,
    questionIds: index % 2 === 0
      ? ['SAMPLE-J1-CHOICE-01', 'SAMPLE-J7-READ-01']
      : ['SAMPLE-J2-CHOICE-01', 'SAMPLE-J8-COMPLETE-01']
  }));
})();
