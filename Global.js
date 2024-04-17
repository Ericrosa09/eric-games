






var debug = false; 

    if(debug) {
      const lcp_sub_parts = [
        'time to first byte',
        'resource load delay',
        'resource load time',
        'element render delay',
      ];

    new performanceobserver((list) => {
      const lcpentry = list.getentries().at(-1);
      const naventry = performance.getentriesbytype('navigation')[0];
      const lcpresentry = performance
        .getentriesbytype('resource')
        .filter((e) => e.name === lcpentry.url)[0];

        // ignore lcp entries that aren't images to reduce devtools noise.
        // comment this line out if you want to include text entries.
        if (!lcpentry.url) return;

        // compute the start and end times of each lcp sub-part.
        // warning! if your lcp resource is loaded cross-origin, make sure to add
        // the `timing-allow-origin` (tao) header to get the most accurate results.
        const ttfb = naventry.responsestart;
        const lcprequeststart = math.max(
          ttfb,
          // prefer `requeststart` (if toa is set), otherwise use `starttime`.
          lcpresentry ? lcpresentry.requeststart || lcpresentry.starttime : 0
        );
        const lcpresponseend = math.max(
          lcprequeststart,
          lcpresentry ? lcpresentry.responseend : 0
        );
        const lcprendertime = math.max(
          lcpresponseend,
          // use lcp starttime (which is the final lcp time) as sometimes
          // slight differences between loadtime/rendertime and starttime
          // due to rounding precision.
          lcpentry ? lcpentry.starttime : 0
        );

        // clear previous measures before making new ones.
        // note: due to a bug this does not work in chrome devtools.
        lcp_sub_parts.foreach((part) => performance.clearmeasures(part));

        // create measures for each lcp sub-part for easier
        // visualization in the chrome devtools performance panel.
        const lcpsubpartmeasures = [
          performance.measure(lcp_sub_parts[0], {
            start: 0,
            end: ttfb,
          }),
          performance.measure(lcp_sub_parts[1], {
            start: ttfb,
            end: lcprequeststart,
          }),
          performance.measure(lcp_sub_parts[2], {
            start: lcprequeststart,
            end: lcpresponseend,
          }),
          performance.measure(lcp_sub_parts[3], {
            start: lcpresponseend,
            end: lcprendertime,
          }),
        ];

        // log helpful debug information to the console.
        console.log('lcp value: ', lcprendertime);
        console.log('lcp element: ', lcpentry.element, lcpentry.url);
        console.table(
          lcpsubpartmeasures.map((measure) => ({
            'lcp sub-part': measure.name,
            'time (ms)': measure.duration,
            '% of lcp': `${
              math.round((1000 * measure.duration) / lcprendertime) / 10
            }%`,
          }))
        );
      }).observe({type: 'largest-contentful-paint', buffered: true});
    }
















console.log('global.js has been loaded!')