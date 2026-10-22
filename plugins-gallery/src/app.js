/**
 * 导航壳脚本:折叠侧边栏 + 导航高亮。
 */
(function () {
  document.getElementById('toggle').addEventListener('click', function () {
    document.body.classList.toggle('collapsed');
  });

  var links = document.querySelectorAll('.nav-item');
  links.forEach(function (link) {
    link.addEventListener('click', function () {
      links.forEach(function (item) { item.classList.remove('active'); });
      link.classList.add('active');
    });
  });

  links[0].classList.add('active');
})();
