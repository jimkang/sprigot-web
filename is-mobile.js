function isMobile() {
  var isMobileMediaQuery = 'only screen and (max-device-height: 568px)';
  return (window.matchMedia(isMobileMediaQuery).matches);
}

module.exports = isMobile;
