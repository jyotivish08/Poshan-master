$(document).ready(function(){
  $.get("/dashboard/nutrition/mdmGraph",function(data,status){
    if(data!="nodata")
    {
      // console.log(data);
      const obj=data;
      console.log(obj);
      const arr=[];
      arr.push(['Year','Mid-day meals given'])
      for(var i=0;i<obj.date.length;i++)
      {
        const num=parseInt(obj.number[i]);
        const item=[obj.date[i],num];
        arr.push(item);
      }
      google.charts.load('current', {'packages':['corechart']});
      google.charts.setOnLoadCallback(drawChart);

      function drawChart() {
        var data = google.visualization.arrayToDataTable(arr);
        var chart = new google.visualization.LineChart(document.getElementById('curve_chart'));
        chart.draw(data);
      }
    }
  });
});
