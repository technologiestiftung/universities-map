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
        
        
        
        const lines = svg.selectAll('g')
            .data(data)
            .enter()
            .append('g')
            .attr('class', 'line__wrapper')
            .append('line')
            .attr('class', 'line__wrapper--line')
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
    module.scale = () => {
        scale = d3.scaleLinear()
            .domain([24, 68429])
            .range([rangeMin, rangeMax]);
        return scale;
    }

    return module;
}

const beeChart = (_data, _filterFunction, _filterKey, _container) => {
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

        return selection;
        
        const selection = d3.event.selection.map(x.invert, x);
        const dots = d3.selectAll('.dot');
        const lines = d3.selectAll('.line__wrapper--line');

        lines.classed("unselected--lines", function(d) {
            const condition = selection[0] >= d[filterKey] || selection[1] <= d[filterKey];
            const current = d3.select(this)
            const y2 = current.attr('y2');
            
            if (condition) {
                current.transition().attr('y2', current.attr('y1') - 2)
            } else {
                current.transition().attr('y2', y2);
            }
        
            return condition;
        });

        lines.classed("selected--lines", function(d) {
            const condition = selection[0] <= d[filterKey] && d[filterKey] <= selection[1];
            const current = d3.select(this)
            const y2 = current.attr('y2');

            if (condition) { current.transition().attr('y2', y2); }

            return condition; 
        });

        dots.classed("selected--cells", function(d) { 
            return selection[0] <= d.datum[filterKey] && d.datum[filterKey] <= selection[1]; 
        });
    }

    const check = () => {
        const brush = d3.select('rect.selection');
        console.log('asdlkjhaslfkjh')
    }
    
    gBrush = g.append('g').attr('class', 'brush')
        .call(brush);

    brush.on('brush', brushed);
    // brush.on('click', check);

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
                return x(d[filterKey]);
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

const tooltip = (_data, _container) => {
    let module = {},
    container = _container,
    data = _data

    console.log(container);

    module.init = () => {
        const wrapper = container.append('div')
            .attr('class', 'tooltip__wrapper')

        console.log(data);
    }

    return module;
}

d3.queue()
    .defer(d3.json, "./data/unis.json")
    .defer(d3.json, "./data/germany.json")
    .await( (error, unis, counties) => {

        let filter = "count_students";
        
        let cross_unis = crossfilter(unis);
        
        count = cross_unis.dimension(function(d) { return d[filter]; });
        count.filter( (d) => {
            if(d > 1) { return true; } 
            else { return false; }
            
        });
                
        const map_chart = mapChart(cross_unis.allFiltered(), counties, '', filter, d3.select('#mapChart'));
        const scale = map_chart.scale();
        map_chart.init();

        console.log(scale);

        const bee_chart = beeChart(cross_unis.allFiltered(), '', filter, d3.select('#beeChart2'))
        bee_chart.init();

        const tool_tip = tooltip(cross_unis.allFiltered(), d3.select('#tooltip'));
        tool_tip.init();
    })