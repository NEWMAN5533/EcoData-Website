// ==========================================
// CREATOR SALES BAR CHART
// ==========================================

let creatorSalesChart = null;

function renderCreatorSalesChart(chartData, metric = "revenue") {

  const chartElement =
    document.querySelector("#creatorSalesChart");

  if (!chartElement) return;


  // ------------------------------------------
  // DESTROY PREVIOUS CHART
  // ------------------------------------------

  if (creatorSalesChart) {

    creatorSalesChart.destroy();

    creatorSalesChart = null;
  }


  // ------------------------------------------
  // VALIDATE DATA
  // ------------------------------------------

  if (
    !Array.isArray(chartData) ||
    chartData.length === 0
  ) {

    chartElement.innerHTML = "";

    const emptyState =
      document.querySelector("#salesChartEmpty");

    if (emptyState) {
      emptyState.style.display = "flex";
    }

    return;
  }


  const emptyState =
    document.querySelector("#salesChartEmpty");

  if (emptyState) {
    emptyState.style.display = "none";
  }


  // ------------------------------------------
  // PREPARE DATA
  // ------------------------------------------

  const categories = chartData.map(item => {

    return item.label || item.date || "";

  });


  const values = chartData.map(item => {

    const value =
      Number(item[metric] || 0);

    return Number.isFinite(value)
      ? value
      : 0;

  });


  // ------------------------------------------
  // TITLES
  // ------------------------------------------

  let chartTitle = "Revenue";

  let chartSubtitle = "Daily revenue";

  let tooltipFormatter = value => {

    return `GHS ${Number(value).toFixed(2)}`;

  };


  if (metric === "sales") {

    chartTitle = "Sales";

    chartSubtitle = "Daily sales";

    tooltipFormatter = value => {

      return `${Number(value)} sale${
        Number(value) === 1 ? "" : "s"
      }`;

    };

  }


  if (metric === "earnings") {

    chartTitle = "Creator Earnings";

    chartSubtitle = "Daily creator earnings";

    tooltipFormatter = value => {

      return `GHS ${Number(value).toFixed(2)}`;

    };

  }


  // ------------------------------------------
  // UPDATE HEADER
  // ------------------------------------------

  const title =
    document.querySelector("#salesChartTitle");

  const subtitle =
    document.querySelector("#salesChartSubtitle");


  if (title) {
    title.textContent = chartTitle;
  }


  if (subtitle) {
    subtitle.textContent = chartSubtitle;
  }


  // ------------------------------------------
  // APEXCHARTS OPTIONS
  // ------------------------------------------

  const options = {

    chart: {

      type: "bar",

      height: 350,

      toolbar: {
        show: false
      },

      zoom: {
        enabled: false
      },

      animations: {

        enabled: true,

        easing: "easeinout",

        speed: 600,

        dynamicAnimation: {
          speed: 350
        }

      }

    },


    series: [

      {

        name: chartTitle,

        data: values

      }

    ],


    xaxis: {

      categories: categories,

      labels: {

        style: {

          fontSize: "10px"

        },

        rotate: -35,

        rotateAlways: false,

        hideOverlappingLabels: true,

        trim: true

      },

      axisBorder: {
        show: false
      },

      axisTicks: {
        show: false
      }

    },


    yaxis: {

      labels: {

        style: {

          fontSize: "10px"

        },

        formatter: function(value) {

          if (metric === "sales") {

            return Math.round(value);

          }

          return `GHS ${Number(value).toFixed(0)}`;

        }

      }

    },


    plotOptions: {

      bar: {

        horizontal: false,

        columnWidth: "42%",

        borderRadius: 7,

        borderRadiusApplication: "end",

        borderRadiusWhenStacked: "last",

        dataLabels: {

          position: "top"

        }

      }

    },


    dataLabels: {

      enabled: false

    },


    grid: {

      show: true,

      borderColor:
        "rgba(128,128,128,0.12)",

      strokeDashArray: 4,

      position: "back",

      xaxis: {

        lines: {
          show: false
        }

      },

      yaxis: {

        lines: {
          show: true
        }

      },

      padding: {

        top: 10,

        right: 10,

        bottom: 0,

        left: 10

      }

    },


    tooltip: {

      enabled: true,

      shared: false,

      intersect: true,

      followCursor: false,

      theme:
        document.body.classList.contains("dark")
          ? "dark"
          : "light",

      y: {

        formatter: tooltipFormatter

      }

    },


    legend: {

      show: false

    },


    states: {

      hover: {

        filter: {

          type: "lighten",

          value: 0.08

        }

      },

      active: {

        filter: {

          type: "darken",

          value: 0.05

        }

      }

    },


    responsive: [

      {

        breakpoint: 600,

        options: {

          chart: {

            height: 290

          },

          plotOptions: {

            bar: {

              columnWidth: "52%",

              borderRadius: 6

            }

          },

          xaxis: {

            labels: {

              rotate: -45,

              fontSize: "8px"

            }

          },

          yaxis: {

            labels: {

              fontSize: "8px"

            }

          }

        }

      }

    ]

  };


  // ------------------------------------------
  // CREATE CHART
  // ------------------------------------------

  creatorSalesChart =
    new ApexCharts(
      chartElement,
      options
    );


  creatorSalesChart.render();

}












//=======================
// SIDEBAR TOGGLE
//=======================

const sidebarMenu = document.querySelector(".sidebarPhone");
const sidebarToggler = document.getElementById("menu");

// Add event listener
sidebarToggler.addEventListener("click", function(e) {
  e.stopPropagation();

  if(sidebarToggler){
    sidebarMenu.style.left = "0";
  }

});

// Window click
window.addEventListener("click", function(e){
  if(!sidebarMenu.contains(e.target) && !sidebarToggler.contains(e.target)){
    sidebarMenu.style.left = "-500px";
  }
});



// SNACKBAR SECTION //
// ===== SNACKBAR FUNCTION ===== //
let snackTimeout = null;

function showSnackBar(message, type = "info", duration = 4000) {
  let snackbar = document.querySelector(".snackbar");

  // Create snackbar if it doesn't exist
  if (!snackbar) {
    snackbar = document.createElement("div");
    snackbar.className = "snackbar";

    snackbar.innerHTML = `
      <span class="snackbar-text"></span>
      <div class="snackbar-progress"></div>
    `;

    document.body.appendChild(snackbar);
  }

  // Update text
  snackbar.querySelector(".snackbar-text").textContent = message;

  // Color by type
  if (type === "success") snackbar.style.background = "rgba(7, 29, 26, 0.95)";
  else if (type === "error") snackbar.style.background = "#88353f";
  else if (type === "warning") snackbar.style.background = "#413b2a";
  else snackbar.style.background = "rgba(7, 29, 26, 0.95)";

  // Reset progress animation
  const progress = snackbar.querySelector(".snackbar-progress");
  progress.style.animation = "none";
  void progress.offsetWidth;
  progress.style.animation = `snackbar-progress ${duration}ms linear forwards`;

  snackbar.classList.add("show");

  // Clear previous timeout
  if (snackTimeout) clearTimeout(snackTimeout);

  snackTimeout = setTimeout(() => {
    snackbar.classList.remove("show");
  }, duration);
}
// snackbar ends

