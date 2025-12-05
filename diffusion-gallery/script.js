// 갤러리 데이터
// GitHub Pages 배포 시: https://scene-the-ella.github.io/diffusion-gallery/
// 모든 파일(svg_input, output_videos)을 같은 폴더에 배치하거나
// 상대 경로를 사용하여 같은 저장소 내의 파일을 참조하세요
const galleryData = [
    {
        id: 1,
        inputImage: 'svg_input/volcano.svg',
        title: 'Volcano',
        prompt: 'A volcano is erupting, and lava is flowing out.',
        description: '화산 이미지를 입력으로 사용한 애니메이션 생성 결과입니다.',
        videos: [
            {
                src: 'output_videos/volcano.gif',
                thumbnail: 'output_videos/volcano.gif'
            },
            {
                src: 'output_videos/volcano.mp4',
                thumbnail: 'output_videos/volcano.gif'
            }
        ]
    },
    {
        id: 2,
        inputImage: 'svg_input/hamburger.svg',
        title: 'Hamburger',
        prompt: 'A hamburger shaking wildly from multiple angles.',
        description: '햄버거 이미지를 입력으로 사용한 애니메이션 생성 결과입니다.',
        videos: [
            {
                src: 'output_videos/hamburger.gif',
                thumbnail: 'output_videos/hamburger.gif'
            },
            {
                src: 'output_videos/hamburger.mp4',
                thumbnail: 'output_videos/hamburger.gif'
            }
        ]
    }
];

// 갤러리 렌더링
function renderGallery() {
    const galleryGrid = document.getElementById('galleryGrid');
    
    if (!galleryGrid) return;

    galleryGrid.innerHTML = galleryData.map(item => `
        <div class="gallery-item">
            <div class="gallery-header">
                <h3>${item.title}</h3>
            </div>
            <div class="process-flow">
                <div class="input-section">
                    <div class="step-label">Input</div>
                    <div class="input-image-container">
                        <img src="${item.inputImage}" alt="${item.title}" loading="lazy">
                    </div>
                    <p class="step-description">Static SVG image</p>
                </div>
                
                <div class="process-arrow">
                    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 30 L40 30 M35 25 L40 30 L35 35" stroke="rgba(0, 212, 255, 0.7)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span class="arrow-label">Animate</span>
                    ${item.prompt ? `<p class="prompt-text">${item.prompt}</p>` : ''}
                </div>
                
                <div class="output-section">
                    <div class="step-label">Output</div>
                    <div class="videos-grid">
                        ${item.videos
                            .filter(video => video.src.endsWith('.gif'))
                            .map((video, index) => {
                                // GIF는 캐시 방지를 위해 타임스탬프 추가 (한 번만)
                                const gifSrc = video.src;
                                return `
                                <div class="video-item gif-item" data-video-src="${video.src}" data-item-id="${item.id}" data-video-index="${index}">
                                    <img src="${gifSrc}" alt="${item.title} animation ${index + 1}" loading="eager" class="gif-image" decoding="async">
                                </div>
                            `;
                            }).join('')}
                    </div>
                    <p class="step-description">Animated result</p>
                </div>
            </div>
        </div>
    `).join('');

    // 비디오 호버 이벤트 추가
    setupVideoInteractions();
    
    // GIF 이미지가 계속 재생되도록 보장
    const gifImages = document.querySelectorAll('.gif-image');
    gifImages.forEach((img, index) => {
        const baseSrc = img.src.split('?')[0];
        
        // 이미지가 보일 때마다 재생되도록 IntersectionObserver 사용
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // 이미지가 보일 때 GIF 재생 보장
                        const currentSrc = entry.target.src;
                        const cleanSrc = currentSrc.split('?')[0];
                        
                        // 소스를 다시 설정하여 GIF 재생 재시작
                        if (entry.target.complete) {
                            entry.target.src = '';
                            // 다음 프레임에서 다시 설정
                            requestAnimationFrame(() => {
                                entry.target.src = cleanSrc;
                            });
                        }
                    }
                });
            }, { 
                threshold: 0.1,
                rootMargin: '50px'
            });
            
            observer.observe(img);
        }
        
        // 주기적으로 GIF 재생 상태 확인 및 재시작 (10초마다)
        const intervalId = setInterval(() => {
            const rect = img.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight + 100 && rect.bottom > -100;
            
            if (isVisible && img.complete) {
                // 이미지가 보이고 로드되었으면, 소스를 다시 설정하여 재생 재시작
                const currentSrc = img.src.split('?')[0];
                img.src = '';
                setTimeout(() => {
                    img.src = currentSrc;
                }, 100);
            }
        }, 10000); // 10초마다
        
        // 이미지가 제거될 때 interval 정리
        img.dataset.intervalId = intervalId;
        
        // 로드 에러 처리
        img.addEventListener('error', () => {
            console.warn('GIF 이미지 로드 실패:', img.src);
        });
    });
}

// 비디오 인터랙션 설정 (GIF만 처리)
function setupVideoInteractions() {
    const videoItems = document.querySelectorAll('.video-item');
    
    videoItems.forEach(item => {
        const img = item.querySelector('img');
        const videoSrc = item.getAttribute('data-video-src');
        
        // GIF 이미지 클릭 시 모달로 확대
        if (img) {
            item.addEventListener('click', () => {
                showVideoModal(videoSrc, 'gif');
            });
        }
    });
}

// 비디오 모달 표시
function showVideoModal(mediaSrc, type = 'video') {
    // 모달이 없으면 생성
    let modal = document.getElementById('videoModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'videoModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
        
        // 닫기 버튼 이벤트
        const closeModal = () => {
            const modalVideo = modal.querySelector('video');
            if (modalVideo) {
                modalVideo.pause();
            }
            modal.classList.remove('active');
        };
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'modal-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', closeModal);
        
        // 모달 배경 클릭 시 닫기
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // ESC 키로 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeModal();
            }
        });
    }
    
    // 모달 내용 업데이트
    if (type === 'gif') {
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close">&times;</button>
                <img src="${mediaSrc}" alt="Animation" style="max-width: 100%; max-height: 80vh; border-radius: 8px;">
            </div>
        `;
    } else {
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close">&times;</button>
                <video controls autoplay>
                    <source src="${mediaSrc}" type="video/mp4">
                    브라우저가 비디오 태그를 지원하지 않습니다.
                </video>
            </div>
        `;
    }
    
    // 닫기 버튼 이벤트 다시 연결
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => {
        const modalVideo = modal.querySelector('video');
        if (modalVideo) {
            modalVideo.pause();
        }
        modal.classList.remove('active');
    });
    
    modal.classList.add('active');
}

// 페이지 로드 시 갤러리 렌더링
document.addEventListener('DOMContentLoaded', () => {
    renderGallery();
});

// 이미지 로드 에러 처리 (GIF는 제외)
document.addEventListener('error', (e) => {
    if (e.target.tagName === 'IMG' && !e.target.classList.contains('gif-image')) {
        // GIF가 아닌 이미지만 placeholder로 교체
        e.target.src = 'https://via.placeholder.com/400x400/667eea/ffffff?text=Image+Not+Found';
    }
}, true);
