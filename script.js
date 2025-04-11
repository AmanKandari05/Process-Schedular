window.onload = function () {
    function clearOutput() {
        document.getElementById("ganttChart").innerHTML = "";
        document.getElementById("results").innerHTML = "";
      }
      
    let processes = [];
  
    document.getElementById("processForm").addEventListener("submit", function (e) {
      e.preventDefault();
  
      const pid = document.getElementById("pid").value;
      const arrival = parseInt(document.getElementById("arrival").value);
      const burst = parseInt(document.getElementById("burst").value);
      const priority = parseInt(document.getElementById("priority").value);
      
      if (!pid || isNaN(arrival) || isNaN(burst)) return;
  
      processes.push({ pid, arrival, burst, priority });
      updateProcessTable();
      this.reset();
    });
  
    function updateProcessTable() {
      const tbody = document.querySelector("#processTable tbody");
      tbody.innerHTML = "";
      processes.forEach((p) => {
        const row = `<tr><td>${p.pid}</td><td>${p.arrival}</td><td>${p.burst}</td></tr>`;
        tbody.innerHTML += row;
      });
    }
  
    document.getElementById("runFCFS").addEventListener("click", () => {      //for First Come First Serve
        clearOutput();
      if (processes.length === 0) return;
  
      const sorted = [...processes].sort((a, b) => a.arrival - b.arrival);
      let time = 0;
      const gantt = [];
      const results = [];
  
      sorted.forEach((p) => {
        if (time < p.arrival) time = p.arrival;
        const start = time;
        const end = time + p.burst;
        const tat = end - p.arrival;
        const wt = tat - p.burst;
  
        gantt.push({ pid: p.pid, start, end });
        results.push({ pid: p.pid, ct: end, tat, wt });
  
        time = end;
      });
  
      renderGantt(gantt);
      renderResults(results);
    });
    document.getElementById("runSJF").addEventListener("click", () => {                 // for Shortest Job First
        clearOutput();
        if (processes.length === 0) return;
      
        let time = 0;
        let completed = 0;
        const n = processes.length;
        const visited = new Array(n).fill(false);
        const gantt = [];
        const results = [];
        const proc = [...processes];
      
        while (completed < n) {
          let idx = -1;
          let minBurst = Infinity;
      
          for (let i = 0; i < n; i++) {
            if (!visited[i] && proc[i].arrival <= time && proc[i].burst < minBurst) {
              minBurst = proc[i].burst;
              idx = i;
            }
          }
      
          if (idx === -1) {
            time++;
            continue;
          }
      
          const start = time;
          const end = start + proc[idx].burst;
          const tat = end - proc[idx].arrival;
          const wt = tat - proc[idx].burst;
      
          gantt.push({ pid: proc[idx].pid, start, end });
          results.push({ pid: proc[idx].pid, ct: end, tat, wt });
      
          visited[idx] = true;
          completed++;
          time = end;
        }
      
        renderGantt(gantt);
        renderResults(results);
      });
      document.getElementById("runRR").addEventListener("click", () => {                   // for Round Robin
        clearOutput();
      
        const quantum = parseInt(document.getElementById("timeQuantum").value);
        if (isNaN(quantum) || quantum <= 0) {
          alert("Please enter a valid time quantum.");
          return;
        }
      
        const n = processes.length;
        const proc = processes.map(p => ({ ...p }));
        const remaining = proc.map(p => p.burst);
        const queue = [];
        const gantt = [];
        const results = [];
        const visited = new Array(n).fill(false);
      
        let time = 0, completed = 0;
      
        while (completed < n) {
          for (let i = 0; i < n; i++) {
            if (proc[i].arrival <= time && !visited[i]) {
              queue.push(i);
              visited[i] = true;
            }
          }
      
          if (queue.length === 0) {
            time++;
            continue;
          }
      
          const idx = queue.shift();
          const execTime = Math.min(quantum, remaining[idx]);
          const start = time;
          const end = time + execTime;
          gantt.push({ pid: proc[idx].pid, start, end });
      
          time += execTime;
          remaining[idx] -= execTime;
      
          // Check for new arrivals during execution
          for (let i = 0; i < n; i++) {
            if (proc[i].arrival > start && proc[i].arrival <= time && !visited[i]) {
              queue.push(i);
              visited[i] = true;
            }
          }
      
          if (remaining[idx] > 0) {
            queue.push(idx);
          } else {
            const ct = time;
            const tat = ct - proc[idx].arrival;
            const wt = tat - proc[idx].burst;
            results.push({ pid: proc[idx].pid, ct, tat, wt });
            completed++;
          }
        }
      
        renderGantt(gantt);
        renderResults(results);
      });

      document.getElementById("runPriority").addEventListener("click", () => {              // for Priority
        clearOutput();
      
        const proc = processes.map(p => ({ ...p }));
        proc.sort((a, b) => {
          if (a.arrival === b.arrival) {
            return a.priority - b.priority;
          }
          return a.arrival - b.arrival;
        });
      
        const n = proc.length;
        const results = [];
        const gantt = [];
      
        let time = 0;
        const isCompleted = new Array(n).fill(false);
        let completed = 0;
      
        while (completed < n) {
          let idx = -1;
          let minPriority = Infinity;
      
          for (let i = 0; i < n; i++) {
            if (proc[i].arrival <= time && !isCompleted[i]) {
              if (proc[i].priority < minPriority) {
                minPriority = proc[i].priority;
                idx = i;
              }
            }
          }
      
          if (idx === -1) {
            time++;
          } else {
            const start = time;
            const end = time + proc[idx].burst;
            gantt.push({ pid: proc[idx].pid, start, end });
      
            time = end;
            const ct = time;
            const tat = ct - proc[idx].arrival;
            const wt = tat - proc[idx].burst;
      
            results.push({ pid: proc[idx].pid, ct, tat, wt });
            isCompleted[idx] = true;
            completed++;
          }
        }
      
        renderGantt(gantt);
        renderResults(results);
      });
      
      
      
  
    function renderGantt(gantt) {
      const container = document.getElementById("ganttChart");
      container.innerHTML = "";
      gantt.forEach((g) => {
        const div = document.createElement("div");
        div.className = "gantt-block";
        div.textContent = `${g.pid} (${g.start}-${g.end})`;
        container.appendChild(div);
      });
    }
  
    function renderResults(data) {
      const div = document.getElementById("results");
      let html = `
        <table>
          <thead>
            <tr>
              <th>PID</th>
              <th>Completion Time</th>
              <th>Turnaround Time</th>
              <th>Waiting Time</th>
            </tr>
          </thead>
          <tbody>
      `;
      data.forEach((d) => {
        html += `
          <tr>
            <td>${d.pid}</td>
            <td>${d.ct}</td>
            <td>${d.tat}</td>
            <td>${d.wt}</td>
          </tr>
        `;
      });
      html += "</tbody></table>";
      div.innerHTML = html;
    }
  };
  