/* globals $ d3 */

const INF = 1000;

const svg = d3.select('body svg');
const width = 960;
const height = 600;
const simulation = d3.forceSimulation()
.velocityDecay(0.3)
.force('link', d3.forceLink().id(d => d.id).distance(200).strength(1))
.force('charge', d3.forceManyBody())
.force('center', d3.forceCenter(width / 2, height / 2))
.force('x', d3.forceX(d => width * d.rate).strength(0.02))
;

$(() => {
    d3.select('svg').selectAll('g').exit().remove();

    const search = $('button#search');
    const isrc = $('input#src');
    const idst = $('input#dst');
    const depth = $('input#depth');

    search.removeAttr('disabled');


    let n = 0;
    const id = new Map();
    const name = new Array();
    const d = new Array();
    let e = new Array();

    d3.csv('./db/sophie.csv', data => {
        const classList = new Map();

        // クラス数の調査
        data.forEach((v, j) => {
            id.set(v['名前'], j);
            name.push(v['名前']);
            for (let i = 0; i < 4; i++) {
                const cs = v['カテゴリ' + i];
                if (!cs) {
                    continue;
                }
                if (!classList.has(cs)) {
                    classList.set(cs, new Array());
                }
                classList.get(cs).push(j);
            }
        });

        // グラフの初期化
        n = id.size;
        d.length = n;
        e.length = n;
        for (let i = 0; i < n; i++) {
            d[i] = new Array(n);
            d[i].fill(INF);
            e[i] = new Array();
        }

        // 初期エッジ
        data.forEach((v, j) => {
            for (let i = 0; i < 4; i++) {
                const ms = v['材料' + i];
                if (!ms) {
                    continue;
                }
                if (classList.has(ms)) {
                    classList.get(ms).forEach(m => {
                        d[m][j] = 1;
                        e[m].push({id: j, as: ms});
                    });
                } else {
                    const m = id.get(ms);
                    d[m][j] = 1;
                    e[m].push({id: j, as: ms});
                }
            }
        });

        // Floyd–Warshall
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                for (let k = 0; k < n; k++) {
                    d[j][k] = Math.min(d[j][k], d[j][i] + d[i][k]);
                }
            }
        }

        resultShow();
    });

    // isrc.val('ハチミツ');
    // idst.val('先見の水晶玉');

    depth.on('change', () => resultShow(depth.val()));


    function resultShow(l) {
        svg.selectAll('g').remove();

        const src = isrc.val();
        const dst = idst.val();
        const iis = id.get(src);
        const iid = id.get(dst);
        // console.log(src, dst);
        // console.log(iis, iid);
        // console.log(name[iis], name[iid]);
        if (typeof iis === 'undefined' || typeof iis === 'undefined') {
            console.log('plz set src and dst');
            console.log('src', iis);
            console.log('dst', iid);
            return;
        }
        const limit = l || d[iis][iid];
        if (limit == 0) {
            return;
        }
        // console.log('limit', limit);
        depth[0].MaterialSlider.change(limit);

        const nodes = new Array();
        const links = new Array();
        nodes.push({id: iis, name: src, end: true, rate: 0, r: 10});
        nodes.push({id: iid, name: dst, end: true, rate: 1, r: 10});
        for (let i = 0; i < n; i++) {
            if (d[iis][i] + d[i][iid] <= limit) {
                nodes.push({
                    id: i,
                    name: name[i],
                    end: false,
                    rate: d[iis][i] / limit,
                    r: 10 - 8 * Math.min(d[iis][i], d[i][iid]) / limit
                });
            }
        }
        nodes.forEach(u => {
            if (typeof u.rate === 'undefined') {
                u.rate = d[iis][u.id] / limit;
            }
            // console.log(u);
        });
        nodes.forEach(u => {
            const edge = new Map();
            e[u.id].forEach(v => {
                if (nodes.find(n => n.id === v.id)) {
                    if (!edge.has(v.id)) {
                        edge.set(v.id, new Array());
                    }
                    edge.get(v.id).push(v.as);
                }
            });
            edge.forEach((l, v) => {
                // console.log({source: u.id, target: v, as: l.join(' '), rev: d[v][u.id] === 1});
                links.push({source: u.id, target: v, as: l.join(' '), rev: d[v][u.id] === 1});
            });
            // links.push({source: u.id, target: v.id, as: v.as});
        });


        const nodelabel = svg.append('g')
        .attr('class', 'nodelabels')
        .selectAll('text')
        .data(nodes)
        .enter().append('text')
        .text(d => d.name);

        const node = svg.append('g')
        .attr('class', 'nodes')
        .selectAll('circle')
        .data(nodes)
        .enter().append('circle')
        .attr('fill', d => d3.interpolateCool(d.rate))
        .attr('r', d => d.r)
        .call(
            d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended)
        );

        const link = svg.append('g')
        .attr('class', 'links')
        .attr('marker-end', 'url(#m_ar)')
        .selectAll('path')
        .data(links)
        .enter().append('path')
        .attr('id', (d, i) => 'linkpath' + i);

        const linklabels = svg.append('g')
        .attr('class', 'linklabels')
        .selectAll('text')
        .data(links)
        .enter()
        .append('text')
        .attr('id', (d, i) => 'linklabel' + i)
        .attr('dx', 80)
        .attr('dy', 0);

        linklabels.append('textPath')
        .attr('xlink:href', (d, i) => '#linkpath' + i)
        .text(d => d.as);

        simulation.stop();
        simulation.alpha(1);
        simulation
        .nodes(nodes)
        .on('tick', ticked);

        simulation.force('link')
        .links(links);

        simulation.restart();


        function linkArc(d) {
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            if (!d.rev) {
                return 'M' + d.source.x + ',' + d.source.y + 'L' + d.target.x + ',' + d.target.y;
            }
            const dr = Math.sqrt(dx * dx + dy * dy);
            return 'M' + d.source.x + ',' + d.source.y
            + 'A' + dr + ',' + dr + ' 0 0,1 ' + d.target.x + ',' + d.target.y;
        }


        function ticked() {
            link.attr('d', linkArc);

            node
            .attr('cx', d => d.x)
            .attr('cy', d => d.y);

            nodelabel
            .attr('x', d => d.x)
            .attr('y', d => d.y);
        }
    }


    search.click(() => {
        search.attr('disabled', true);
        resultShow();
        search.removeAttr('disabled');
    });
});

function dragstarted(d) {
    if (!d3.event.active) {
        simulation.alphaTarget(0.3).restart();
    }
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

function dragended(d) {
    if (!d3.event.active) {
        simulation.alphaTarget(0);
    }
    d.fx = null;
    d.fy = null;
}
