const mapChart = function (_data, _geojson, _filterFunction, _filterKey, _container) {
    let module = {},
    data = _data,
    geojson = _geojson,
    container = _container,
    arr = [],
    extent,
    width = 500,
    height = 500,
    rangeMin = 1,
    rangeMax = 150,
    scale,
    svg = container.append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr("stroke", "#D3D3D3")
        .attr("stroke-width", "1px")
        .attr("fill", "none"),
    proj = d3.geoMercator()
        .scale(2000)
        .center([11.42, 50.91])
        .translate([width / 2, height / 2]),
    path = d3.geoPath()
        .projection(proj)
    svg.append("path").attr('d', path(topojson.mesh(geojson)))

    module.init = () => {
        data.forEach( item => {
            arr.push(item.count_students);
        })

        extent = d3.extent(arr);
        // console.log(extent)
        scale = d3.scaleLinear()
            .domain([24, 68429])
            .range([rangeMin, rangeMax]);
        
        svg.selectAll('line')
            .data(data)
            .enter()
            .append('line')
            .attr('class', 'map__line')
            .attr("x1", d => { 
                if(d.count_students) {
                    const  lnglat = proj([d.lng, d.lat]);
                    return lnglat[0]
                } else { return "1px" }
            })
            .attr("y1", d => { 
                if(d.count_students) {
                    const  lnglat = proj([d.lng, d.lat]);
                    return lnglat[1]
                }
            })
            .attr("x2", d => { 
                if(d.count_students) {
                    const  lnglat = proj([d.lng, d.lat]);
                    return lnglat[0]
                }
            })
            .attr("y2", d => { 
                if(d.count_students) {
                    const  lnglat = proj([d.lng, d.lat]);
                    // console.log(`scale in Px: ${scale(d.count_students)}, count as int: ${d.count_students}, pos in px: ${lnglat[1]}`)
                    return lnglat[1] - scale(d.count_students);
                } else {
                    return "1px"
                }
            })
            .attr("stroke", "black")
            .attr("stroke-width", "1px")
    }
    return module;
}

const beeChartPlugin = (_data, _filterFunction, _filterKey, _container) => {
    let module = {},
    width = 960,
    height = 500,
    margin = { top: 40, right: 40, bottom: 40, left: 40 },
    innerHeight = height - margin.top - margin.bottom,
    innerWidth = width - margin.left - margin.right,
    container = _container,
    filterKey = _filterKey,
    data = _data,
    swarm,
    svg,
    brush = d3.brushX(),
    gBrush,
    g,
    x,
    arr = []

    svg = container.append('svg')
        .attr('width', width)
        .attr('height', height)
    
    g = svg.append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    const brushed = () => {
        if(!d3.event.selection) return;
        const selection = d3.event.selection.map(x.invert, x);
        const dots = d3.selectAll('.dot');
        const lines = d3.selectAll('.map__line');

        lines.classed("selected--lines", function(d) { 
            return selection[0] <= d.count_students && d.count_students <= selection[1]; 
        });

        dots.classed("selected--cells", function(d) { 
            return selection[0] <= d.datum.count_students && d.datum.count_students <= selection[1]; 
        });
    }
    
    gBrush = g.append('g').attr('class', 'brush')
        .call(brush);

    brush.on('brush', brushed);

    module.init = () => {
        data.forEach(uni => {
            arr.push(uni[filterKey]);
        })

        extent = d3.extent(arr);
        
        x = d3.scaleLinear()
            .domain([extent[0], extent[1]])
            .range([0, innerWidth])
            
        swarm = d3.beeswarm()
            .data(data)
            .distributeOn((d) => { 
                return x(d.count_students);
            })
            .radius(3)
            .orientation('horizontal')
            .side('symetric')
            .arrange()
            
        g.append('g')
            .attr('class', 'axis axis--x')
            .attr("transform", "translate(0," + innerHeight + ")")
            .call(d3.axisBottom(x).ticks(20, ".0s"));
                
        cell = g.append('g')
            .attr("class", "cells");

        cell.selectAll('circle')
            .data(swarm)
            .enter()
              .append('circle')
                .attr('class', 'dot')
                .attr('cx', function(bee) { return bee.x; })
                .attr('cy', function(bee) { return bee.y + 200; })
                .attr('r', 2)
                // .style('fill', function(bee) { return fillScale(bee.datum.bar); })
    }
    return module;
}


d3.queue()
    .defer(d3.json, "./data/unis.json")
    .defer(d3.json, "./data/germany.json")
    .await( (error, unis, counties) => {

        let cross_unis = crossfilter(unis);

        count = cross_unis.dimension(function(d) { return d.count_students; });
        count.filter( (d) => {
            if(d > 1) { return true; } 
            else { return false; }
            
        });

        // console.log(cross_unis.allFiltered());

        const map_chart = mapChart(cross_unis.allFiltered(), counties, '', 'count_students', d3.select('#mapChart'));
        map_chart.init();

        // const bee_chart = beeChart(cross_unis.allFiltered(), '', 'count_students', d3.select('#beeChart'));
        // bee_chart.init();

        const bee_chart_2 = beeChartPlugin(cross_unis.allFiltered(), '', 'count_students', d3.select('#beeChart2'))
        bee_chart_2.init();
    })