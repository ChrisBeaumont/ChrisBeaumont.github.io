/*global d3,$*/
(function(d3, $, colorbrewer) {
    "use strict";

    var xpad = 50,
    ypad = 50,
    w = 416 + xpad,
    h = 416 + ypad,
    emph_pairs = false,
    emph_suited = false,
    emph_connected = false,
    emph_duplicate = false,
    svg = d3.select("#plot")
    .append('svg')
    .attr('width', w)
    .attr('height', h),
    svg2 = d3.select("#plot2")
    .append('svg')
    .attr('width', w)
    .attr('height', h),
    svg3 = d3.select("#plot3")
    .append('svg')
    .attr('width', w)
    .attr('height', h),
    svg4 = d3.select("#plot4")
    .append('svg')
    .attr('width', w)
    .attr('height', h),
    xsc, ysc, colorScale, frequencyScale, odds, rect,
    RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"],
    SUITS = ["&spades;", "&hearts;", "&clubs;", "&diams;"],
    drawBox, parseData,
    MISSING = '#555',
    url = "https://holdem-odds.chrisbeaumont.org.s3-website-us-east-1.amazonaws.com/data/",
    RANK1, SUIT1, RANK2, SUIT2;

    var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
        var h2 = hand2string(d.rank1, d.suit1) + hand2string(d.rank2, d.suit2);
        var h1 = hand2string(RANK1, SUIT1) + hand2string(RANK2, SUIT2);

        var result = '<p>' + h1 + " vs " + h2 + '</p>';
        if (isNaN(d.v)) {
            result += 'Duplicate Cards';
        } else {
            result += '<p> Win% - Lose% = ' + (d.v * 100).toFixed(1) + '%';
        }
        return result;
    });
    svg.call(tip);

    var tip2 = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
        var h = hand2string(d.rank1, d.suit1) + hand2string(d.rank2, d.suit2);
        var result = '<p>' + h + '</p>';
        if (isNaN(d.v)) {
            result += "Duplicate Cards";
        } else {
            result += '<p> Average Win% - Lose% = ' + (d.v * 100).toFixed(1);
        }
        return result;
    });
    svg2.call(tip2);

    var tip3 = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
        var h = hand2string(d.rank1, d.suit1) + hand2string(d.rank2, d.suit2);
        var result = '<p>' + h + '</p>';
        if (isNaN(d.v)) {
            result += "Duplicate Cards";
        } else {
            result += '<p> Played in ' + (d.v * 100).toFixed(3) + '% of hands </p>';
        }
        return result;
    });
    svg3.call(tip3);

    var tip4 = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
        var h = hand2string(d.rank1, d.suit1) + hand2string(d.rank2, d.suit2);
        var result = '<p>' + h + '</p>';
        if (isNaN(d.v)) {
            result += "Duplicate Cards";
        } else {
            result += '<p> Weighted Win% - Lose% = ' + (d.v * 100).toFixed(1);
        }
        return result;
    });
    svg4.call(tip4);

    drawBox = function(svg, tip, dataset, cbar) {
        svg.selectAll('.box').remove();
        svg.selectAll('.picked').remove();

        odds = svg.append('g')
        .selectAll('.odds')
        .data(dataset)
        .enter();

        odds.append('rect')
        .attr('x', function(d) {
            return xsc(d.x);
        })
        .attr('y', function(d) {
            return ysc(d.y + 1);
        })
        .attr('fill', function(d) {
            return isNaN(d.v) ? MISSING : cbar(d.v);
        })
        .attr('class', function(d) {
            return "row-" + d.x + " col-" + d.y + ' box';
        })
        .attr('stroke', 'none')
        .attr('rank1', function(d) {return d.rank1;})
        .attr('rank2', function(d) {return d.rank2;})
        .attr('suit1', function(d) {return d.suit1;})
        .attr('suit2', function(d) {return d.suit2;})
        .attr('width',  xsc(1) - xsc(0))
        .attr('height', ysc(0) - ysc(1))
        .attr('pair', function(d) {return d.isPair;})
        .attr('suited', function(d) {return d.suited;})
        .attr('connected', function(d) {return d.connected;})
        .attr('duplicate', function(d) {return isNaN(d.v);})
        .on('mouseover', function(d) {
            tip.show(d);
            svg.select('.picked')
            .attr('x', xsc(d.x))
            .attr('y', ysc(d.y + 1))
            .classed('highlight-box', true);
        });


        svg.append('rect')
        .attr('class', 'picked')
        .attr('width', xsc(1) - xsc(0))
        .attr('height', ysc(0) - ysc(1))
        .attr('fill', 'none');

        svg.on('mouseleave', function(d) {
            svg.select('.picked').classed('highlight-box', false);
            tip.hide(d);
        });
    };

    parseData = function(d) {
        var x = d.i % 52,
        y = Math.floor(d.i / 52),
        rank1 = Math.floor(x / 4),
        rank2 = Math.floor(y / 4),
        suit1 = x % 4,
        suit2 = y % 4;

        return {
            x: x,
            y: y,
            rank1: rank1,
            rank2: rank2,
            suit1: suit1,
            suit2: suit2,
            isPair: (rank1 === rank2),
            suited: (suit1 == suit2),
            connected: ((Math.abs(rank1 - rank2) == 1) ||
                (rank1 === 0 & rank2 === 12) ||
                (rank2 === 12 & rank2 === 0)),
            v: parseFloat(d.score),
        };
    };

    function find_att(att) {
        return $('.box').filter(function() {
            return $(this).attr(att) === 'true';
        });
    }

    function toggle_duplicates() {
        emph_duplicate ^= true;
        update_emph();
    }

    function toggle_pair() {
        emph_pairs ^= true;
        update_emph();
    }

    function toggle_suited() {
        emph_suited ^= true;
        update_emph();
    }

    function toggle_connected() {
        emph_connected ^= true;
        update_emph();
    }

    function emphasize(elements, state) {
        d3.selectAll(elements).classed('emphasize', state);
    }

    function update_emph() {
        emphasize($('.box'), false);
        if (emph_pairs)
            emphasize(find_att('pair'), true);
        if (emph_suited)
            emphasize(find_att('suited'), true);
        if (emph_connected)
            emphasize(find_att('connected'), true);
        if (emph_duplicate)
            emphasize(find_att('duplicate'), true);
    }

    function getParameterByName(name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
        return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    }

    function hand2string(rank, suit) {
        var result = RANKS[rank] + SUITS[suit];
        if (suit % 2 == 1) {
            result = "<span class='red'>" + result + "</span>";
        }
        return result;
    }

    function draw_axis(svg, xlabel, ylabel) {
        //drawXAxis();
        var ticklbl = (d3.svg.axis()
         .tickSize(6, 12)
         .tickValues([2, 6, 10, 14, 18, 22, 26, 30, 34, 38, 42, 46, 50])
         .tickFormat(function (d){ return RANKS[Math.floor(d / 4)];}));

        var tickln = (d3.svg.axis()
           .tickSize(6, 12)
           .tickValues([0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52])
           .tickFormat(function(d){return "";}));

        //draw y axis
        svg.append('g')
        .attr('class', 'axis axis-y')
        .attr('transform', 'translate(' + xpad + ',0)')
        .call(ticklbl
          .scale(ysc)
          .orient('left')
          )
        .append('text')
        .text(ylabel)
        .attr('transform', 'rotate(-90)')
        .attr('x', - h / 2 + ypad / 2)
        .attr('y', -xpad * 0.8)
        .style('text-anchor', 'middle')

        svg.append('g')
        .attr('class', 'axis axis-tick')
        .attr('transform', 'translate(' + (xpad) + ',0)')
        .call(tickln
          .scale(ysc)
          .orient('left')
          );

        // draw x axis
        svg.append('g')
        .attr('class', 'axis axis-x')
        .attr('transform', 'translate(0, ' + (h - ypad) + ')')
        .call(ticklbl
          .scale(xsc)
          .orient('bottom')
          )
        .append('text')
        .text(xlabel)
        .attr('x', xsc(26))
        .attr('y', ypad * .8)
        .style('text-anchor', 'middle');

        svg.append('g')
        .attr('class', 'axis axis-tick')
        .attr('transform', 'translate(0, ' + (h - ypad) + ')')
        .call(tickln
          .scale(xsc)
          .orient('bottom')
          );
    }

    function setup(dataset) {
        colorScale = d3.scale.linear()
        .domain(d3.range(-0.9, 1.1, 0.2))
        .range(colorbrewer.RdBu[10]);

        frequencyScale = d3.scale.linear()
        .domain(d3.range(0, 0.0035, 0.0035 / 9.0))
        .range(colorbrewer.YlOrBr[9].reverse());

        xsc = d3.scale.linear()
        .domain([0, 52])
        .range([xpad, w]);

        ysc = d3.scale.linear()
        .domain([0, 52])
        .range([h - ypad, 0]);

        draw_axis(svg, 'First Opponent Card', 'Second Opponent Card');
        draw_axis(svg2, 'First Card', 'Second Card');
        draw_axis(svg3, 'First Card', 'Second Card');
        draw_axis(svg4, 'First Card', 'Second Card');

    }

    function card2idx(card) {
        var rank = card[0], suit = card[1];
        suit = {S: 0, H: 1, C: 2, D: 3}[suit];
        return suit + RANKS.indexOf(rank) * 4;
    }

    function load_data(hand) {
        var path, c1, c2, i, j, handsplt;

        hand = hand.toUpperCase();
        handsplt = hand.split(' ');

        if(handsplt.length != 2) {
            return load_data('8H QS');
        }

        c1 = handsplt[0];
        c2 = handsplt[1];
        i = card2idx(c1);
        j = card2idx(c2);
        if(isNaN(i) || isNaN(j) || i == j) {
            return load_data('8H QS');
        }

        RANK1 = Math.floor(i / 4);
        SUIT1 = i % 4;
        RANK2 = Math.floor(j / 4);
        SUIT2 = j % 4;

        if (i > j) {
            var tmp = i;
            i = j;
            j = tmp;
        }

        $('#hand_val').val(hand);
        $('#hand_display').html(hand2string(RANK1, SUIT1) +
            hand2string(RANK2, SUIT2)
            );
        location.hash = hand.replace(' ', '+');

        path = url + i + '_' + j + '.csv';
        //path = 'data/hand_frequencies.csv';
        d3.csv(path, parseData, function(d) {
            drawBox(svg, tip, d, colorScale);
        });
    }

    setup();
    load_data(location.hash.replace('+', ' ').replace('#', ''));

    d3.csv(url + 'avg.csv', parseData, function(d){
        drawBox(svg2, tip2, d, colorScale);
    });

    d3.csv(url + 'hand_frequencies.csv', parseData,
     function(d) {
        drawBox(svg3, tip3, d, frequencyScale);
    }
    );

    d3.csv(url + 'weighted.csv', parseData,
     function(d) {
        drawBox(svg4, tip4, d, colorScale);
    }
    );

    $('#show-pairs').hover(toggle_pair, toggle_pair);
    $('#show-suited').hover(toggle_suited, toggle_suited);
    $('#show-duplicate').hover(toggle_duplicates, toggle_duplicates);
    $('.show-hand').click(function(event) {
        event.preventDefault();
        load_data($(this).attr('href'));
    });

    $('#enter_hand').submit(function(event) {
        event.preventDefault();
        var hand = $('#hand_val').val();
        load_data(hand);
    });

}(d3, $, colorbrewer));
