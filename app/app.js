var canvas = document.getElementById("canvas");
var layersul = document.getElementById("layersul");
var ctx = canvas.getContext("2d");
var layers = [{text: "wowowoli"}];
var img_bg = false;
var lastPos =  {x:0, y:0}
var customfonts = []
document.fonts.ready.then(function (e) {
  console.log(">",e.forEach);
  e.forEach(function(el){
    console.log("*>",el.family);
    customfonts.push(el.family)
    var f = $('<option value="'+el.family+'" style="font-family: '+el.family+';">'+el.family+'</option>')
    $(".fonts").prepend(f)
  })
  $(".fonts option").attr("selected",false)
  $($(".fonts option")[0]).attr("selected",true)
  setTimeout(function(){
    Layers.update()
    Layers.updateCTX()
  },100)
});

document.getElementById("addnota").addEventListener("click", function(){
    //let txtinout = window.prompt("Texto:")
    Layers.add("text","----",canvas.width/2,canvas.height/2)
})
$(function(){
  $(".fonttools_").hide()

  /*$(".changefontset").on("change", function(){
    console.log("CHANGE FONT")
    var fontfamily = $(".changefontset.fonts option:selected").text()
    var fontsize = $(".changefontset.fontsize").val()
    var align = $(".changefontset.align option:selected").text()
    console.log("NEW FONT",fontfamily, fontsize, align);
    Layers.selected.format = {fontfamily,fontsize,align}
    Layers.updateCTX()
  })*/

  $(".datalist").hide()
  $("#hidedatalist").on("click", function(){
    Layers.updateCTX()
    $(".datalist").hide()
    $("ul#layersul").show()

  })

  $("#change_value").on("click", function(){
      console.log("change_value")
      var vv = Data.getNext()
      Layers.updateCTX()
      console.log(vv)
  })

  $("#lista").on("click", function(){
    Data.plot()
    $(".datalist").show()
    $("ul#layersul").hide()
  })
  $("#test").on("click", function(){
    Layers.genera()
  })
  $("#play").on("click", function(){
    cuantos = Data.data.length
    if(cuantos<=0){
      return
    }
    var c = confirm("Se generarán "+cuantos+" Archivos, ¿desea continuar?")
    if(c){
      Layers.generaAll()
    }
  })



})

var Layers = {
  layers: [],
  moving: false,
  moving_offset: [0,0],
  selected: false,
  startmovepos: [],
  lastmovepos: [],
  currmovepos: [],
  currentoffset: [0,0],
  show_guides: true,
  _init: $(function(){
    lastmovepos = JSON.parse(window.localStorage.getItem("windowspos"))
    Layers.layers = JSON.parse(window.localStorage.getItem("layers"))
    for(var ll in Layers.layers){
      lay = Layers.layers[ll]
      if("image" in lay){
        var im = window.localStorage.getItem("img_"+lay.label)
        if(im){
          console.log("lay",lay, im);
          lay.image = new Image();
          lay.image.src = im;
        }
      }
    }
    //window.localStorae.setItem("img_"+label, data.src)
    if(!lastmovepos){
      window.localStorage.setItem("windowspos",JSON.stringify([0,0]))
      lastmovepos=[0,0]
    }
    console.log("sett|",lastmovepos)
    $(".layers").css({"left": lastmovepos[0], "top": lastmovepos[1]})
    $("#clear").on("click", function(){
      Layers.layers=[]

      for (var i = 0; i < window.localStorage.length; i++) {
        if(window.localStorage.key(i).includes("img_")){
          window.localStorage.removeItem(window.localStorage.key(i))
        }
      }
      window.localStorage.setItem("layers","[]")
      window.location.reload()

    })
    $(canvas).on("mousedown", function(e){
      Layers.startmovepos = [e.clientX,e.clientY]
      Layers.currmovepos = Layers.startmovepos
      Layers.currentoffset=[Layers.selected.x-Layers.startmovepos[0], Layers.selected.y-Layers.startmovepos[1]]
    });
    $(canvas).on("mousemove", function(e){
      if (Layers.currmovepos.length <= 0){
        e.preventDefault();
        return
      }
      Layers.lastmovepos = [e.clientX, e.clientY]
      Layers.currmovepos = Layers.lastmovepos
      Layers.moving_update(Layers.lastmovepos)
    });

    $("body").on("keypress", function(e){
      if(e.charCode == 43){ //+
        let tp = Layers.layers.indexOf(Layers.selected)
        if(tp+1 < Layers.layers.length){
          Layers.layers =  array_move(  Layers.layers , tp, tp+1)
          Layers.update()
        }
      }else if (e.charCode == 45) { //-
        let tp = Layers.layers.indexOf(Layers.selected)
        if(tp-1 >= 0){
          Layers.layers =  array_move(  Layers.layers , tp, tp-1)
          Layers.update()

        }
      }
    });

    $("body").on("mouseup", function(){
      if(Layers.moving){
        //last time moving
        window.localStorage.setItem("windowspos",JSON.stringify([$(".layers").position().left,$(".layers").position().top]))
        window.localStorage.setItem("layers", JSON.stringify(Layers.layers))
      }
      Layers.moving = false
    })

    $(".layers .barri").on("mouseup", function(e){
      console.log("STOP moveing");
      //Layers.lastmovepos = [e.clientX, e.clientY]

    });
    $(canvas).on("mouseup", function(e){


      lastPos.x = e.clientX
      lastPos.y = e.clientY
      Layers.startmovepos = []
      Layers.currmovepos = []
      Layers.moving_offset = []
    });

    $(".layers .barri, canvas").on("mousedown", function(e){

      console.log("STRART moveing", e, e.currentTarget)
      if($(".barri")[0] == e.currentTarget){
        var offset = $('.layers').offset();
        console.log("offset", offset)
        Layers.moving_offset = [-e.offsetX, -e.offsetY]
        Layers.moving = true
        Layers.update()
      }
    })

    $(".layers .barri, canvas").on("mousemove", function(e){
      if(Layers.moving){
        var x = e.pageX+Layers.moving_offset[0];
        $(".layers").css({"left": x, "top": e.clientY+Layers.moving_offset[1]})
      }
    })

    $(layersul).html("<li><label><input type='radio' name='selectedlayer' value='' checked />No Selected</label></li>")
    if(!Layers.layers){
      Layers.layers = []
    }else{
      console.log("tiene layers",Layers.layers)
      setTimeout(function(){
        Layers.update()
        Layers.updateCTX()
      },100)
    }
  }),
  getDyns: function() {
    return Layers.layers
  },
  moving_update: function(pos) {
    if(Layers.selected){
      Layers.selected.x = pos[0]+Layers.currentoffset[0]
      Layers.selected.y = pos[1]+Layers.currentoffset[1]
      Layers.updateCTX()
    }
  },
  add: function(tipo, data, x, y, label=""){
    if (label ==""){
      label = tipo+"_"+Layers.layers.length
    }
    if(tipo=="image"){
      window.localStorage.setItem("img_"+label, data.src)
    }
    let obj =  {x:x, y:y, label: label}
    obj[tipo] = data;
    Layers.layers.push(obj)
    Layers.selected = obj
    Layers.update()
  },
  select: function(i){
    Layers.selected = Layers.layers[i];
    $(canvas).css("cursor","move")
    var $li = $($("#layersul li")[Layers.layers.length-Number.parseInt(i)])
    $li.append(Layers.$fonttolins)
    $(".txtedit").hide()
    if("text" in Layers.selected){
      $li.find(".txtedit").show()
    }
    if(Layers.selected.format){
      //console.log("tiene fotmato, set",".changefontset.fonts option[value='"+Layers.selected.format.fontfamily+"']");
      $(".changefontset.fonts option").attr("selected",false)
      var $opt = $(".changefontset.fonts option[value='"+Layers.selected.format.fontfamily.replace("\"",'\\"')+"']")
      $opt.attr("selected", true)
      $(".changefontset.fonts").val(Layers.selected.format.fontfamily)

      $(".changefontset.fontsize").val(Layers.selected.format.fontsize)

      $(".changefontset.align option").attr("selected",false)
      $(".changefontset.align option[value='"+Layers.selected.format.align.toLowerCase()+"'").attr("selected",true)
      $(".changefontset.align").val(Layers.selected.format.align.toLowerCase())
      $(".changefontset.colorpic").val(Layers.selected.format.color)
    }else{
      $(".changefontset.fonts option").attr("selected",false)
      $(".changefontset.fontsize").val(63)
      $(".changefontset.align option").attr("selected",false)
      $(".changefontset.colorpic").val("#000000")
    }
  },
  generaAll: function() {
    console.log("generanding", Data.data);
    Data.data.index=0
    for (var dr in Data.data) { //por cada registro
      Data.getNext()
      Layers.genera()
      console.log("put", dr)
    }

  },
  genera: function(){
    Layers.show_guides = false
    Layers.updateCTX()
    var img    = canvas.toDataURL("image/png");
    var link = document.createElement('a');
    link.download = Data.getCurrentfname()+'.png';
    link.href = img
    link.click();
    Layers.show_guides = true
  },
  update: function(){
    var check =  ""
    if(Layers.selected){
      check = "checked"
    }
    Layers.$fonttolins = $(".fonttools_").clone()
    Layers.$fonttolins.addClass("inst")
    Layers.$fonttolins.addClass("fonttools")
    Layers.$fonttolins.removeClass("fonttools_")
    Layers.$fonttolins.find(".changefontset").off("change")
    Layers.$fonttolins.find(".changefontset").on("change", function(){
      console.log("CHANGE FONT", this)
      var fontfamily  = $(this).parent().parent().find(".fonts").find("option:selected").text()
      var fontsize    = $(this).parent().parent().find(".fontsize").val()
      var align       = $(this).parent().parent().find(".align").find("option:selected").text()
      var color       = $(this).parent().parent().find(".colorpic").val()
      Layers.selected.format = {fontfamily,fontsize,align, color}
      console.log("!!CHANGE FONT>>>>>",fontfamily, fontsize, align, color);
      Layers.updateCTX()
    })

    Layers.$fonttolins.find("#hidefonttools").on("click", function(){
      $(".fonttools.inst").hide()
    })
    $(layersul).html("<li><label><input type='radio' name='selectedlayer' value='' "+check+"/>No Selected</label></li>")
    Layers.layers.reverse()
    var lysd=Layers.layers.slice()
    Layers.layers.reverse()
    for(var i in lysd){
      var cl = lysd[i]
      let elm
      var txtbtn = "<button class='txtedit' style='display: none;'>💬</button>"
      if(cl == Layers.selected){
        elm = $("<li><label class='cl_"+cl.label+"'><input type='radio' name='selectedlayer' value='"+(Layers.layers.length-i-1)+"' checked />"+cl.label+"</label>"+txtbtn+"</li>")
      }else{
        elm = $("<li><label class='cl_"+cl.label+"'><input type='radio' name='selectedlayer' value='"+(Layers.layers.length-i-1)+"' />"+cl.label+"</label>"+txtbtn+"</li>")
      }
      $(layersul).append(elm)
      elm.find(".txtedit").on("click", function(){
          Layers.$fonttolins.show()
          $(".txtedit").hide()
      })
      elm[0].addEventListener("dblclick", function(){
        var t = window.prompt("Layer Name:")
        Layers.selected.label = t.replace(" ","_")
        Layers.update()
      })
    }

    $("input[name=selectedlayer]").on("change",function(e){
      var $input =  $(e.currentTarget)
      if ($input.val()){

        Layers.select($input.val())

      }else{
        Layers.selected = false
      }
      Layers.updateCTX()
    })
    Layers.updateCTX()
    for (var i in Data.cols_dyns) {
      var cl = "cl_"+Data.cols_dyns[i];
      $("."+cl).addClass("dyn")
    }
  },
  draw_guides: function(ctx,x,y,w,h, type = "img") {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    if(type=="text"){
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.moveTo(x, 0);
      ctx.lineTo(x,canvas.height);
    }else{
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.moveTo(0, y+h);
      ctx.lineTo(canvas.width, y+h);

      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);

      ctx.moveTo(x+w,0);
      ctx.lineTo(x+w, canvas.height);

    }

    ctx.stroke();
  },
  updateCTX:function(){
    if( layers.length <= 0 ){
      return false
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for(var i in Layers.layers){
      let thislayer = Layers.layers[i]
      if( "image" in thislayer && thislayer.image.src){
        console.log(JSON.stringify(thislayer.image));
        if(!thislayer.image){
          return
        }
        ctx.drawImage(thislayer.image, thislayer.x,thislayer.y,thislayer.image.width, thislayer.image.height);
        if(thislayer == Layers.selected && Layers.show_guides){
          Layers.draw_guides(ctx, thislayer.x, thislayer.y, thislayer.image.width, thislayer.image.height)
        }
      }
      if( "text" in thislayer){
        if(thislayer.format){
          console.log("format>>>", thislayer.format)
          ctx.font = thislayer.format.fontsize+'px '+thislayer.format.fontfamily;
          ctx.textAlign = thislayer.format.align.toLowerCase();
          ctx.fillStyle  = thislayer.format.color.toLowerCase();
        }else{
          ctx.font = '60px "Notera"';
          ctx.textAlign = "center";
        }
        ctx.fillText(Data.getDynamicValue(thislayer.label),  thislayer.x,  thislayer.y);
        if(thislayer == Layers.selected && Layers.show_guides){
          Layers.draw_guides(ctx, thislayer.x, thislayer.y,0, 0, "text")
        }
      }

    }
    window.localStorage.setItem("layers", JSON.stringify(Layers.layers))
  }
}
var Data = {
  data: [],
  cols_dyns: {},
  index: 0,
  init: $(function(){
    var data = JSON.parse(window.localStorage.getItem("datasave"))
    Data.cols_dyns = JSON.parse(window.localStorage.getItem("cols_dyns"))
    if(!Data.cols_dyns){
      Data.cols_dyns = []
    }
    Data.newData(data)
    //Layers.add("text","Layere",canvas.width/2,canvas.height/2)
    //Layers.add("text","Sass",canvas.width/2,(canvas.height/2)+100)
  }),
  getCurrentfname: function() {
    var d = Data.data[Data.getIndex()]
    if(Data.cols_dyns){
      for (var i in Data.cols_dyns){
        if(Data.cols_dyns[i] == "-fname-"){
          return d[i].replace(/[^a-z0-9]/gi, '_').toLowerCase();
        }
      }
    }
    return d[0].replace(/[^a-z0-9]/gi, '_').toLowerCase();
  },
  getIndex: function() {
    if(Data.index<0){
      //todo
      console.log("Index=", 0);
      return 0
    }else if(Data.data && Data.index >= Data.data.length){
      console.log("Index=", 0);
      return 0
    }
    return Data.index;
  },
  getNext: function(){
    Data.index++
    if(Data.index > Data.data.length){
      Data.index = -2
    }
    if(Data.index<0){
      if (Data.index==-1) {
        //show Largest Text
      }else if(Data.index == -2){
        //show shortest Text
      }
    }else{ // if is in arr
      console.log("caso normal++");
      return Data.data[Data.getIndex()]
    }

  },
  newData: function(nd) {
    Data.data = nd
    Data.plot()
    window.localStorage.setItem("datasave",JSON.stringify(nd))
  },
  getDynamicValue: function(busca) {
    if(!Data.data || Data.data.length<=0){
      return ""
    }
    for (var i = 0; i < Data.data[Data.getIndex()].length; i++) {
      if(Data.cols_dyns && Data.cols_dyns[i] == busca){
        return Data.data[Data.getIndex()][i]
      }
    }
    return "{{"+busca+"}}"
  },
  selectDyn: function(col) {
    var $sel = $("<select data-colid='"+col+"'></select>")
    var dins = Layers.getDyns()
    var o = $("<option></option>")
    $sel.append(o)

    if(Data.cols_dyn && Data.cols_dyns[col] == "-fname-"){
      o = $("<option value='-fname-' selected>-fname-</option>")
    }else{
      o = $("<option value='-fname-'>-fname-</option>")
    }
    $sel.append(o)
    for (var i in dins){

      if(Data.cols_dyn && Data.cols_dyns[col] == dins[i].label){
        var o = $("<option value='"+dins[i].label+"' selected>"+dins[i].label+"</option>")
      }else{
        var o = $("<option value='"+dins[i].label+"'>"+dins[i].label+"</option>")
      }
      $sel.append(o)
      console.log("din", dins[i].labels)
    }

    return $sel
  },
  plot: function() {
    console.log("Plot Data Table");
    var $table = $("table.tableplot");
    $table.html("")
    var $row = $("<tr></tr>")

    for(var i in Data.data){
      var row = $row.clone()

      if(i==0){
        for(var c in  Data.data[i]){
          let co = $("<td></td>")
          if( !Data.selectDyn(c))
            return
          var $sellink =  Data.selectDyn(c).clone()
          $sellink.on("change", function(e){
            console.log("slsct changed",e , this);

            Data.cols_dyns[$(this).data("colid")] = $(this).val()
            for (var i in Data.cols_dyns) {
              var cl = "cl_"+Data.cols_dyns[i];
              $("."+cl).addClass("dyn")
            }
            console.log("cols_dyns>>>",Data.cols_dyns);
            window.localStorage.setItem("cols_dyns",JSON.stringify(Data.cols_dyns))
            Layers.updateCTX()
          })
          co.append($sellink)
          row.append(co)
        }
        $table.append(row)
        row = $row.clone()
      }

      for(var c in  Data.data[i]){
        let d = Data.data[i][c]
        let co = $("<td>"+d+"</td>")
        row.append(co)
      }
      $table.append(row)
    }
  }
}
const setBG = function(ev) {
  canvas.width = ev.target.width;
  canvas.height = ev.target.height;
}

fileinput.addEventListener("change", function(ev){
  console.log(ev)
  var input = ev.target;
  var file = input.files[0];
  var fr = new FileReader();
  fr.onload = function(ev){
    img = new Image();
    img.src = ev.currentTarget.result;
    if(layers.length <= 0 ){
      img.onload = setBG
    }else{
        img.onload = function(){
          Layers.updateCTX()
        }
    }
    Layers.add("image",img,0,0)

  };   // onload fires after reading is complete
  fr.readAsDataURL(file);    // begin reading
  //input.remove()
})


canvas.addEventListener("click", function(e){
  Layers.updateCTX()
  //paintBG(ctx, {"x": e.clientX, "y": e.clientY})

})

function array_move(arr, old_index, new_index) {
    while (old_index < 0) {
        old_index += arr.length;
    }
    while (new_index < 0) {
        new_index += arr.length;
    }
    if (new_index >= arr.length) {
        var k = new_index - arr.length + 1;
        while (k--) {
            arr.push(undefined);
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    return arr; // for testing purposes
};

document.querySelector('#datapaste').addEventListener('paste', (e) => {
    e.preventDefault();
    const text = (e.originalEvent || e).clipboardData.getData('text/plain');
    console.log("sadasdasd", text.split("\n"))
    var rows = text.split("\n")
    var new_data = []
    for(var i in rows){
        var el = rows[i].split("\t");
        new_data.push(el)
    }
    console.log(new_data)
    Data.newData(new_data)
    //window.document.execCommand('insertText', false, text);
});
