// docs/js/tsp_demo.js
document.addEventListener("DOMContentLoaded", function() {
  const demoDiv = document.getElementById("tsp-demo");
  if (!demoDiv) return;

  // ヘッダー・説明文と2つのボタン、キャンバスを生成
  demoDiv.innerHTML = `
    <h2>Traveling Salesman Problem アニメーションデモ</h2>
    <p>「Start Animation」ボタンを押すと、最近傍法による TSP の計算経過がアニメーションで表示されます。<br>
       解が完成した後、「Start Local Search」ボタンで局所探索（2-opt）による改善を開始します。</p>
    <button id="start-animation">Start Animation</button>
    <button id="start-local-search" disabled>Start Local Search</button>
    <br><br>
    <canvas id="tsp-canvas" width="600" height="600" style="border:1px solid #ccc;"></canvas>
  `;

  const startAnimButton = document.getElementById("start-animation");
  const startLocalButton = document.getElementById("start-local-search");
  const canvas = document.getElementById("tsp-canvas");
  const ctx = canvas.getContext("2d");

  let currentTour = null;  // 最近傍法で求めた解（最終ツアー）を保持する

  // --- ユーティリティ関数 ---

  // ランダムに点を生成する関数
  function generatePoints(numPoints) {
    const points = [];
    for (let i = 0; i < numPoints; i++) {
      points.push({
        x: Math.random() * (canvas.width - 40) + 20,
        y: Math.random() * (canvas.height - 40) + 20
      });
    }
    return points;
  }

  // 点の描画
  function drawPoints(points) {
    ctx.fillStyle = "red";
    for (const p of points) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 2点間の距離を求める
  function distance(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  // ツアーの総距離を計算する（巡回路として最初の点に戻る）
  function tourLength(tour) {
    let len = 0;
    for (let i = 0; i < tour.length - 1; i++) {
      len += distance(tour[i], tour[i+1]);
    }
    len += distance(tour[tour.length - 1], tour[0]);
    return len;
  }

  // 2-opt のための部分ツアーを反転する
  function twoOptSwap(tour, i, k) {
    const newTour = tour.slice(0, i)
      .concat(tour.slice(i, k+1).reverse())
      .concat(tour.slice(k+1));
    return newTour;
  }

  // ツアーを描画する
  // tour.complete が true ならば、閉じた巡回路として描画
  function drawTour(tour) {
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (tour.length > 0) {
      ctx.moveTo(tour[0].x, tour[0].y);
      for (let i = 1; i < tour.length; i++) {
        ctx.lineTo(tour[i].x, tour[i].y);
      }
      if (tour.complete) {
        ctx.lineTo(tour[0].x, tour[0].y);
      }
    }
    ctx.stroke();
  }

  // キャンバスのクリア
  function resetCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // --- 最近傍法による TSP アニメーション ---
  function animateTSP() {
    const numPoints = 30;  // 点の数を30に変更
    const points = generatePoints(numPoints);

    // 初期描画
    resetCanvas();
    drawPoints(points);

    // 最近傍法による TSP の計算の初期化
    let remaining = points.slice();
    const tour = [];
    let current = remaining.shift();
    tour.push(current);

    // 再帰的に各ステップをアニメーションで実行する関数
    function animateStep() {
      resetCanvas();
      drawPoints(points);
      drawTour(tour);

      if (remaining.length === 0) {
        // 全ての点を訪問したら、経路を閉じる
        tour.complete = true;
        resetCanvas();
        drawPoints(points);
        drawTour(tour);
        currentTour = tour;  // この解を局所探索の初期解として保存
        startLocalButton.disabled = false;  // 局所探索ボタンを有効にする
        startAnimButton.disabled = false;
        return;
      }

      // 現在の点から最も近い点を探索
      let nearestIndex = 0;
      let nearestDist = distance(current, remaining[0]);
      for (let i = 1; i < remaining.length; i++) {
        const d = distance(current, remaining[i]);
        if (d < nearestDist) {
          nearestDist = d;
          nearestIndex = i;
        }
      }
      current = remaining.splice(nearestIndex, 1)[0];
      tour.push(current);

      // 次のステップを 500ms 後に実行
      setTimeout(animateStep, 500);
    }

    animateStep();
  }

  // --- 局所探索（2-opt）による改善のアニメーション ---
  function animateLocalSearch() {
    if (!currentTour) return; // まだ初期解がない場合は何もしない

    // 改善中の解をコピー（元の解を改変しないため）
    let tour = currentTour.slice();
    tour.complete = true;  // 巡回路として閉じる
    let improvementFound = false;
    let iteration = 0;

    function localSearchStep() {
      let bestTour = tour;
      let bestLength = tourLength(tour);
      improvementFound = false;

      // 2-opt: 全ての組み合わせ (i, k) を試す
      for (let i = 1; i < tour.length - 1; i++) {
        for (let k = i + 1; k < tour.length; k++) {
          const newTour = twoOptSwap(tour, i, k);
          newTour.complete = true;
          const newLength = tourLength(newTour);
          if (newLength < bestLength) {
            bestTour = newTour;
            bestLength = newLength;
            improvementFound = true;
          }
        }
      }

      // 描画の更新
      resetCanvas();
      // 再描画：全点はそのまま
      drawPoints(tour);
      // 現在のツアーを描画
      drawTour(bestTour);

      if (improvementFound) {
        tour = bestTour;  // 改善された解を採用
        iteration++;
        // 次の改善ステップを 500ms 後に実行
        setTimeout(localSearchStep, 500);
      } else {
        // これ以上改善が見られなかったら局所最適解として終了
        currentTour = tour;
        startLocalButton.disabled = false;  // ボタンを再度有効にする
        console.log("Local search finished after " + iteration + " iterations. Final tour length: " + bestLength);
      }
    }

    // 局所探索中はボタンを無効化して連続クリックを防止
    startLocalButton.disabled = true;
    localSearchStep();
  }

  // --- ボタンのイベント登録 ---
  startAnimButton.addEventListener("click", function() {
    // アニメーション開始前にボタン類を無効化
    startAnimButton.disabled = true;
    startLocalButton.disabled = true;
    currentTour = null;  // 初期解リセット
    animateTSP();
  });

  startLocalButton.addEventListener("click", function() {
    // 局所探索開始
    animateLocalSearch();
  });
});
