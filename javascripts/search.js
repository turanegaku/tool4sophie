/*globals $ d3 Materialize*/

$(() => {
    const search = $('#search');
    const searching = $('.preloader-wrapper.small');
    const result = d3.select('ul#result');
    const isrc = $('input#src');
    const idst = $('input#dst');

    // カテゴリに含まれるアイテム
    const category = new Map();
    // 構成要素
    const alchemy = new Map();
    // 補完候補 Mapだとautocompleteで認識してくれない
    const completes = {};
    const completeg = {};

    $('.range-field>input#depth').mouseup(() => {
        $('span.thumb').remove();
        $('.range-field>input#depth').blur();
    });


    d3.csv('../acquaintance.csv', data => {
        data.forEach(v => {
            // アイテムは候補に含める
            completes[v.name] = null;
            let alchable = false;
            // 構成要素
            alchemy.set(v.name, new Array());
            for (let i = 0; i < 4; i++) {
                // カテゴリもゴールの候補に含める
                const c = v['c' + i];
                if (c) {
                    completeg[c] = null;
                    if (!category.has(c)) {
                        category.set(c, new Array());
                    }
                    category.get(c).push(v.name);
                }

                // 構成要素
                const m = v['m' + i];
                if (m) {
                    alchable = true;
                    alchemy.get(v.name).push(m);
                }
            }
            // 錬成可能ならゴールにも含める
            if (alchable) {
                completeg[v.name] = null;
            }
        });

        $('input.autocompletes').autocomplete({
            'data': completes
        });
        $('input.autocompleteg').autocomplete({
            'data': completeg
        });

        searchRoute(true);

        function searchRoute(first) {
            result.selectAll('ul>li').remove();

            const src = isrc.val();
            const dst = idst.val();
            const depth = parseInt($('input#depth').val(), 10);
            if (!(src in completes && dst in completeg)) {
                if (!first) {
                    if (!src) {
                        Materialize.toast('src を指定してください', 2000);
                    } else if (!(src in completes)) {
                        Materialize.toast(src + 'が見つかりませんでした', 2000);
                    }
                    if (!dst) {
                        Materialize.toast('dst を指定してください', 2000);
                    } else if (!(dst in completes)) {
                        Materialize.toast(dst + 'が見つかりませんでした', 2000);
                    }
                }
                return;
            }

            // dst側から探索する
            const que = new Array();
            let pdepth = 0;
            que.push(new Array(dst));
            while (que.length > 0) {
                const p = que.shift();
                const pp = p[p.length - 1];
                // 見つかった
                if (pp == src) {
                    p.reverse();

                    result.append('li')
                        .classed('collection-item', true)
                        .selectAll('span')
                        .data(p).enter()
                        .append('span')
                        .text(d => {
                            return d + ' ';
                        });
                    continue;
                }
                // 長すぎる
                if (p.length > depth * 2) {
                    break;
                }
                if (pdepth < p.length) {
                    result.append('li')
                        .classed('collection-item', true)
                        .text(Math.floor(p.length / 2 + 1));
                    pdepth = p.length;
                }

                const m = alchemy.has(pp) ? alchemy.get(pp) : new Array(pp);
                m.forEach(v => {
                    if (category.has(v)) {
                        category.get(v).forEach(vv => {
                            if (!(vv in p)) {
                                const sp = p.concat();
                                sp.push(v, vv);
                                que.push(sp);
                            }
                        });
                    } else if (!(v in p)) {
                        const sp = p.concat();
                        sp.push(v, v);
                        que.push(sp);
                    }
                });
            }
            searching.removeClass('active');
            search.removeClass('disabled');
        }

        search.click(() => {
            setTimeout(() => {
                search.addClass('disabled');
                searching.addClass('active');

                setTimeout(() => {
                    searchRoute();
                }, 10);
            });
        });
    });
});
