let map_chart, bee_chart, tool_tip;

const rangeMin = 1,
rangeMax = 150,
filter = "count_students",
scale = d3.scaleLinear()
    .domain([24, 68429])
    .range([rangeMin, rangeMax]);




const mapChart = function (_data, _geojson, _filterFunction, _filterKey, _container) {
    let module = {},
    data = _data,
    geojson = _geojson,
    container = _container,
    arr = [],
    filterKey = _filterKey,
    extent,
    width = 500,
    height = 500,
    rangeMin = 1,
    rangeMax = 150,
    scale,
    lines,
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
        
        lines = svg.selectAll('g')
            .data(data)
            .enter()
            .append('g')
            .attr('class', 'line__wrapper')
            .append('line')
            .attr('class', 'line__wrapper--line')
            .attr("x1", d => { 
                if(d[filterKey]) {
                    const  lnglat = proj([d.lng, d.lat]);
                    return lnglat[0]
                } else { return "1px" }
            })
            .attr("y1", d => { 
                if(d[filterKey]) {
                    const  lnglat = proj([d.lng, d.lat]);
                    return lnglat[1]
                }
            })
            .attr("x2", d => { 
                if(d[filterKey]) {
                    const  lnglat = proj([d.lng, d.lat]);
                    return lnglat[0]
                }
            })
            .attr("y2", d => { 
                if(d[filterKey]) {
                    const  lnglat = proj([d.lng, d.lat]);
                    return lnglat[1] - scale(d[filterKey]);
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
    module.update = (data) => {

        
        data.forEach( uni => {

            lines
                .attr('class', d => {
                    const color = d[filterKey] == uni[filterKey] ? 'selected--lines' : 'unselected--lines';
                    return color;
                })
        
        })
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
        const selection = d3.event.selection.map(x.invert, x);
        brush_extent = selection;
        let uni_selection = { 'included': [], 'excluded': [] };
        
        // make selection of data points to send to update function
        data.forEach(uni => {
            const included = selection[0] <= uni[filterKey] && uni[filterKey] <= selection[1];
            const excluded = uni[filterKey] < selection[0] || uni[filterKey] > selection[1];

            if (included) { 
                uni_selection.included.push(uni); 
            } else {
                uni_selection.excluded.push(uni);
            }
        });

        // update(filterKey);
        update(uni_selection);
    }
    
    gBrush = g.append('g').attr('class', 'brush')
        .call(brush);

    brush.on('end', brushed);

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
                .on('mouseover', d => { update(d); })
    }
    return module;
}

d3.queue()
    .defer(d3.json, "./data/unis.json")
    .defer(d3.json, "./data/germany.json")
    .await( (error, unis, counties) => {
        let brush_extent;
        let cross_unis = crossfilter(unis);
        
        count = cross_unis.dimension(function(d) { return d[filter]; });
        count.filter( (d) => {
            if(d > 1) { return true; } 
            else { return false; }
            
        });
                
        map_chart = mapChart(cross_unis.allFiltered(), counties, '', filter, d3.select('#mapChart'));
        map_chart.init();

        bee_chart = beeChart(cross_unis.allFiltered(), '', filter, d3.select('#beeChart2'))
        bee_chart.init();

        tool_tip = tooltip(cross_unis.allFiltered(), d3.select('#tooltip'));
        tool_tip.init();
    })

update = (selection) => {
    // case brush selection
    if (selection.included != undefined) {
        console.log('inside brush selection');
        map_chart.update(selection.included);
    }
    // case single item hovered
    else if (selection.datum != undefined) {
        console.log('inside single item');
        const selection_arr = [selection.datum];
        map_chart.update(selection_arr);
    }

    tool_tip.update(selection);
}

// update = (filterKey) => {
//     let selection = brush_extent;
//     const dots = d3.selectAll('.dot');
//     const lines = d3.selectAll('.line__wrapper--line');

//     lines.classed("selected--lines", function(d) {
//         const condition = selection[0] <= d[filterKey] && d[filterKey] <= selection[1];
//         const current = d3.select(this)
//         const y2 = current.attr('y2');
//         return condition; 
//     });

//     lines.classed("unselected--lines", function(d) {
//         const condition = d[filterKey] < selection[0] || d[filterKey] > selection[1];
//         const current = d3.select(this)
//         const y1 = this.getAttribute('y1')
        
//         if (condition) { 
//             current.transition().attr('y2', d => { return y1 - 2; });
//         } else if (!condition) {
//             current.transition().attr('y2', d => { return y1 - scale(d[filter]); });
//         }
//         return condition;
//     });

//     dots.classed("selected--cells", function(d) { 
//         return selection[0] <= d.datum[filterKey] && d.datum[filterKey] <= selection[1]; 
//     });
// }

const tooltip = (_data, _container) => {
    let module = {},
    container = _container,
    block__name, block__type, block__status
    data = _data[2] // send real data as the input

    const props = [
        {'name': 'Name'},
        {'sponsor': 'Träger'},
        {'county': 'Bundesland'},
        {'year': 'Gründung'},
        {'count_studies': 'Anzahl Studiengänge'},
        {'count_students': 'Anzahl Studenten'}
    ];
    
    module.init = () => {
        const wrapper = container.append('div')
            .attr('class', 'tooltip__wrapper')

            props.forEach(prop => {
                block__name = wrapper.append('div')
                    .attr('class', `block__${Object.keys(prop)[0]}`)

                block__type = block__name
                    .append('span')
                    .attr('class', `block__${Object.keys(prop)[0]}--type`)
                    .text(`${Object.values(prop)[0]}: `)

                block__status = block__name
                    .append('span')
                    .attr('class', `block__${Object.keys(prop)[0]}--status`)
                    .text(data[Object.keys(prop)[0]])
            })
    }
        module.update = (data) => {
            props.forEach (prop => {
                const selection = d3.select(`.block__${Object.keys(prop)[0]}--status`);
                selection.text(data.datum[Object.keys(prop)[0]])
            })
        }
        return module;
    }






            
    // const dots = d3.selectAll('.dot');
    // const lines = d3.selectAll('.line__wrapper--line');

    // lines.classed("unselected--lines", function(d) {
    //     const condition = selection[0] >= d[filterKey] || selection[1] <= d[filterKey];
    //     const current = d3.select(this)
    //     const y2 = current.attr('y2');
        
    //     if (condition) {
    //         current.transition().attr('y2', current.attr('y1') - 2)
    //     } else {
    //         current.transition().attr('y2', y2);
    //     }
    
    //     return condition;
    // });

    // lines.classed("selected--lines", function(d) {
    //     const condition = selection[0] <= d[filterKey] && d[filterKey] <= selection[1];
    //     const current = d3.select(this)
    //     const y2 = current.attr('y2');

    //     if (condition) { current.transition().attr('y2', y2); }

    //     return condition; 
    // });

    // dots.classed("selected--cells", function(d) { 
    //     return selection[0] <= d.datum[filterKey] && d.datum[filterKey] <= selection[1]; 
    // });